const VARIANTES = {
  navbar: { archivo: 'logo-navbar', size: 38 },
  footer: { archivo: 'logo-footer', size: 40 },
  login: { archivo: 'logo-login', size: 72 },
} as const;

export default function Logo({ variant, sx }: { variant: keyof typeof VARIANTES; sx?: object }) {
  const { archivo, size } = VARIANTES[variant];
  return (
    <picture>
      <source type="image/webp" srcSet={`/img/logo/${archivo}.webp 1x, /img/logo/${archivo}@2x.webp 2x`} />
      <img
        src={`/img/logo/${archivo}.png`}
        srcSet={`/img/logo/${archivo}@2x.png 2x`}
        width={size}
        height={size}
        alt="Lavadero Bella Italia"
        style={{ borderRadius: '50%', display: 'block', flexShrink: 0, ...sx }}
      />
    </picture>
  );
}
