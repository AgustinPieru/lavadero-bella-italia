// WSAA — Web Service de Autenticación y Autorización de ARCA.
// Especificación: "Especificación Técnica del WebService de Autenticación y
// Autorización" (arca.gob.ar/afip.gob.ar). Todo servicio de negocio de ARCA
// (acá: "wsfe", Factura Electrónica) exige primero pedir acá un Token +
// Sign firmando un "Ticket de Requerimiento de Acceso" (TRA) con el
// certificado digital habilitado para ese servicio.
import fs from 'fs';
import crypto from 'crypto';
import forge from 'node-forge';
import { XMLParser } from 'fast-xml-parser';
import { arcaConfig, isArcaConfigurado, getArcaUrls } from './config';

export interface AuthTicket {
  token: string;
  sign: string;
  expirationTime: string; // ISO
}

// El ticket dura ~12hs y ARCA rate-limita logins repetidos para el mismo
// servicio — se cachea en memoria por proceso, por "service" (acá siempre
// "wsfe", pero queda genérico).
const ticketCache = new Map<string, AuthTicket>();

function buildTicketRequestXml(service: string): string {
  const now = new Date();
  const generationTime = new Date(now.getTime() - 60_000).toISOString();
  const expirationTime = new Date(now.getTime() + 10 * 60_000).toISOString();
  const uniqueId = Math.floor(now.getTime() / 1000);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<loginTicketRequest version="1.0">',
    '<header>',
    `<uniqueId>${uniqueId}</uniqueId>`,
    `<generationTime>${generationTime}</generationTime>`,
    `<expirationTime>${expirationTime}</expirationTime>`,
    '</header>',
    `<service>${service}</service>`,
    '</loginTicketRequest>',
  ].join('');
}

// Firma el TRA como CMS/PKCS#7 (igual que `openssl smime -sign`) con el
// certificado y la clave privada del lavadero, y lo devuelve en base64 —
// así es como ARCA exige recibirlo en loginCms.
function signTicketRequest(traXml: string): string {
  const certPem = fs.readFileSync(arcaConfig.certPath, 'utf8');
  const keyPem = fs.readFileSync(arcaConfig.keyPath, 'utf8');

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(traXml, 'utf8');
  p7.addCertificate(certPem);
  p7.addSigner({
    key: forge.pki.privateKeyFromPem(keyPem),
    certificate: certPem,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      // @types/node-forge tipa `value` como string, pero forge acepta (y
      // espera) un Date real acá: lo convierte a UTCTime internamente.
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  });
  p7.sign();
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return Buffer.from(der, 'binary').toString('base64');
}

async function callLoginCms(cmsBase64: string): Promise<string> {
  const envelope = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">',
    '<soapenv:Header/>',
    '<soapenv:Body>',
    '<wsaa:loginCms>',
    `<wsaa:in0>${cmsBase64}</wsaa:in0>`,
    '</wsaa:loginCms>',
    '</soapenv:Body>',
    '</soapenv:Envelope>',
  ].join('');

  const res = await fetch(getArcaUrls().wsaa, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '' },
    body: envelope,
  });
  const text = await res.text();
  if (!res.ok) {
    throw { status: 502, message: `WSAA respondió ${res.status}: ${text.slice(0, 500)}`, code: 'ARCA_WSAA_ERROR' };
  }

  const parser = new XMLParser({ removeNSPrefix: true });
  const parsed = parser.parse(text);
  const loginCmsReturn = parsed?.Envelope?.Body?.loginCmsResponse?.loginCmsReturn;
  if (!loginCmsReturn) {
    throw { status: 502, message: 'Respuesta de WSAA sin loginCmsReturn', code: 'ARCA_WSAA_ERROR' };
  }
  return loginCmsReturn;
}

export async function getAuthTicket(service = 'wsfe'): Promise<AuthTicket> {
  if (!isArcaConfigurado()) {
    throw {
      status: 503,
      message: 'ARCA no está configurado (falta CUIT, certificado o clave privada). Ver apps/backend/src/lib/arca/config.ts.',
      code: 'ARCA_NO_CONFIGURADO',
    };
  }

  const cached = ticketCache.get(service);
  if (cached && new Date(cached.expirationTime).getTime() > Date.now() + 60_000) {
    return cached;
  }

  const tra = buildTicketRequestXml(service);
  const cms = signTicketRequest(tra);
  const loginTicketResponseXml = await callLoginCms(cms);

  const parser = new XMLParser({ removeNSPrefix: true });
  const parsed = parser.parse(loginTicketResponseXml);
  const credentials = parsed?.loginTicketResponse?.credentials;
  const header = parsed?.loginTicketResponse?.header;
  if (!credentials?.token || !credentials?.sign) {
    throw { status: 502, message: 'WSAA no devolvió token/sign', code: 'ARCA_WSAA_ERROR' };
  }

  const ticket: AuthTicket = {
    token: credentials.token,
    sign: credentials.sign,
    expirationTime: header?.expirationTime ?? new Date(Date.now() + 10 * 60_000).toISOString(),
  };
  ticketCache.set(service, ticket);
  return ticket;
}

// Útil para debug manual: hash del certificado configurado, para confirmar
// desde los logs que se está usando el archivo esperado sin volcar la clave.
export function certFingerprint(): string | null {
  if (!arcaConfig.certPath || !fs.existsSync(arcaConfig.certPath)) return null;
  const certPem = fs.readFileSync(arcaConfig.certPath, 'utf8');
  return crypto.createHash('sha256').update(certPem).digest('hex').slice(0, 16);
}
