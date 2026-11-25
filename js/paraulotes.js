const PARAULOTES = [
  'PUTA', 'PUTO', 'PUTE', 'MERD', 'MIERD', 'POLLA', 'CONYO', 'CULO',
  'CAGAR', 'FOLLA', 'FOTRE', 'CABRO', 'MARIC', 'MAMON', 'PENE', 'TETA',
  'ZORRA', 'GUARR', 'NAZI', 'HITLR', 'FUCK', 'SHIT', 'DICK', 'COCK',
  'CUNT', 'PUSSY', 'BITCH', 'NIGG', 'FAG', 'SEX', 'PORN', 'ASS'
];

export function normalitzaInicials(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 5);
}

export function teParaulota(inicials) {
  const normalitzades = normalitzaInicials(inicials);
  return PARAULOTES.some((paraula) => normalitzades.includes(paraula));
}
