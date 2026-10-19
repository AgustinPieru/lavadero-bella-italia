// WSFEv1 — Web Service de Factura Electrónica de ARCA (RG 4291).
// Especificación: "Manual para el desarrollador V.4.7" (arca.gob.ar/afip.gob.ar).
// Todo método exige el Auth{Token,Sign,Cuit} que entrega WSAA (ver wsaa.ts).
import { XMLParser } from 'fast-xml-parser';
import { getAuthTicket } from './wsaa';
import { arcaConfig, isArcaConfigurado, getArcaUrls } from './config';

function ensureConfigurado() {
  if (!isArcaConfigurado()) {
    throw {
      status: 503,
      message: 'ARCA no está configurado (falta CUIT, certificado, clave privada o punto de venta).',
      code: 'ARCA_NO_CONFIGURADO',
    };
  }
}

async function callWsfev1(operation: string, innerXml: string): Promise<any> {
  const envelope = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">',
    '<soapenv:Header/>',
    '<soapenv:Body>',
    innerXml,
    '</soapenv:Body>',
    '</soapenv:Envelope>',
  ].join('');

  const res = await fetch(`${getArcaUrls().wsfev1}?op=${operation}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `http://ar.gov.afip.dif.FEV1/${operation}`,
    },
    body: envelope,
  });
  const text = await res.text();
  if (!res.ok) {
    throw { status: 502, message: `WSFEv1 respondió ${res.status}: ${text.slice(0, 500)}`, code: 'ARCA_WSFEV1_ERROR' };
  }
  const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: true, parseTagValue: false });
  return parser.parse(text)?.Envelope?.Body;
}

export interface FEDummyResult {
  appServer: string;
  dbServer: string;
  authServer: string;
}

export async function dummy(): Promise<FEDummyResult> {
  const body = await callWsfev1('FEDummy', '<ar:FEDummy/>');
  const r = body?.FEDummyResponse?.FEDummyResult;
  return { appServer: r?.AppServer, dbServer: r?.DbServer, authServer: r?.AuthServer };
}

export async function ultimoComprobanteAutorizado(cbteTipo: number, ptoVta = arcaConfig.puntoVenta): Promise<number> {
  ensureConfigurado();
  const auth = await getAuthTicket();
  const xml = [
    '<ar:FECompUltimoAutorizado>',
    `<ar:Auth><ar:Token>${auth.token}</ar:Token><ar:Sign>${auth.sign}</ar:Sign><ar:Cuit>${arcaConfig.cuit}</ar:Cuit></ar:Auth>`,
    `<ar:PtoVta>${ptoVta}</ar:PtoVta>`,
    `<ar:CbteTipo>${cbteTipo}</ar:CbteTipo>`,
    '</ar:FECompUltimoAutorizado>',
  ].join('');
  const body = await callWsfev1('FECompUltimoAutorizado', xml);
  const r = body?.FECompUltimoAutorizadoResponse?.FECompUltimoAutorizadoResult;
  return parseInt(r?.CbteNro ?? '0', 10);
}

// Tipos de comprobante y de documento más comunes para un lavadero (ver
// FEParamGetTiposCbte / FEParamGetTiposDoc si se necesitan más adelante).
export const CBTE_TIPO = { FACTURA_A: 1, FACTURA_B: 6, FACTURA_C: 11 } as const;
export const DOC_TIPO = { CUIT: 80, DNI: 96, CONSUMIDOR_FINAL: 99 } as const;

export interface SolicitarCaeInput {
  cbteTipo: number; // CBTE_TIPO.*
  docTipo: number; // DOC_TIPO.*
  docNro: string; // CUIT/DNI del cliente, o '0' para consumidor final
  impNeto: number;
  impIVA: number;
  impTotal: number;
  ivaAlicuotaId?: number; // 5 = 21% (ver FEParamGetTiposIva) — default 21%
}

export interface SolicitarCaeResult {
  resultado: 'A' | 'R' | 'P'; // Aprobado / Rechazado / Parcial
  cae: string | null;
  caeFchVto: string | null;
  cbteNro: number;
  errores: { code: string; msg: string }[];
  observaciones: { code: string; msg: string }[];
}

// Solicita el CAE (autorización) de UN comprobante contra WSFEv1. No se usa
// todavía desde el flujo normal de Facturación (ver facturas.service.ts) —
// queda disponible para cuando haya certificado real, vía el endpoint
// POST /facturas/:id/emitir-arca.
export async function solicitarCae(input: SolicitarCaeInput): Promise<SolicitarCaeResult> {
  ensureConfigurado();
  const auth = await getAuthTicket();
  const ptoVta = arcaConfig.puntoVenta;
  const proximoNro = (await ultimoComprobanteAutorizado(input.cbteTipo, ptoVta)) + 1;
  const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const alicIva = input.ivaAlicuotaId ?? 5; // 5 = 21%

  const xml = [
    '<ar:FECAESolicitar>',
    `<ar:Auth><ar:Token>${auth.token}</ar:Token><ar:Sign>${auth.sign}</ar:Sign><ar:Cuit>${arcaConfig.cuit}</ar:Cuit></ar:Auth>`,
    '<ar:FeCAEReq>',
    `<ar:FeCabReq><ar:CantReg>1</ar:CantReg><ar:PtoVta>${ptoVta}</ar:PtoVta><ar:CbteTipo>${input.cbteTipo}</ar:CbteTipo></ar:FeCabReq>`,
    '<ar:FeDetReq><ar:FECAEDetRequest>',
    '<ar:Concepto>1</ar:Concepto>', // 1 = Productos/Servicios (lavado = servicio, pero WSFEv1 usa 1 para ambos sin detalle de ítem)
    `<ar:DocTipo>${input.docTipo}</ar:DocTipo>`,
    `<ar:DocNro>${input.docNro || '0'}</ar:DocNro>`,
    `<ar:CbteDesde>${proximoNro}</ar:CbteDesde>`,
    `<ar:CbteHasta>${proximoNro}</ar:CbteHasta>`,
    `<ar:CbteFch>${hoy}</ar:CbteFch>`,
    `<ar:ImpTotal>${input.impTotal}</ar:ImpTotal>`,
    '<ar:ImpTotConc>0</ar:ImpTotConc>',
    `<ar:ImpNeto>${input.impNeto}</ar:ImpNeto>`,
    '<ar:ImpOpEx>0</ar:ImpOpEx>',
    '<ar:ImpTrib>0</ar:ImpTrib>',
    `<ar:ImpIVA>${input.impIVA}</ar:ImpIVA>`,
    '<ar:MonId>PES</ar:MonId>',
    '<ar:MonCotiz>1</ar:MonCotiz>',
    `<ar:Iva><ar:AlicIva><ar:Id>${alicIva}</ar:Id><ar:BaseImp>${input.impNeto}</ar:BaseImp><ar:Importe>${input.impIVA}</ar:Importe></ar:AlicIva></ar:Iva>`,
    '</ar:FECAEDetRequest></ar:FeDetReq>',
    '</ar:FeCAEReq>',
    '</ar:FECAESolicitar>',
  ].join('');

  const body = await callWsfev1('FECAESolicitar', xml);
  const result = body?.FECAESolicitarResponse?.FECAESolicitarResult;
  const cab = result?.FeCabResp;
  const det = result?.FeDetResp?.FECAEDetResponse ?? result?.FeDetResp?.FEDetResponse;
  const errores = [].concat(result?.Errors?.Err ?? []).map((e: any) => ({ code: String(e?.Code), msg: e?.Msg }));
  const observaciones = [].concat(det?.Obs?.Observaciones ?? []).map((o: any) => ({ code: String(o?.Code), msg: o?.Msg }));

  return {
    resultado: cab?.Resultado ?? 'R',
    cae: det?.CAE ?? null,
    caeFchVto: det?.CAEFchVto ?? null,
    cbteNro: proximoNro,
    errores,
    observaciones,
  };
}
