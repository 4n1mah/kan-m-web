export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "18296107064";

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WA_MESSAGES = {
  general: "Hola Kan M, me gustaría hacer un pedido.",
  product: (name: string) =>
    `Hola Kan M, me interesa "${name}". ¿Me puedes compartir más detalles?`,
  catering: "Hola Kan M, me gustaría cotizar un servicio de catering para mi evento.",
  contact: (name: string, msg: string) =>
    `Hola Kan M, soy ${name}. ${msg}`,
};
