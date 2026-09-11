import { afterEach, describe, expect, it } from "vitest";
import { HOLIDAY_OVERRIDES, isOpenNow } from "@/lib/bizInfo";

// Horario real: lunes a jueves 9–19, viernes a domingo 9–22.
// República Dominicana es UTC-4 todo el año, así que la hora local RD es
// la hora UTC menos 4. Cada caso se construye con un instante UTC explícito
// para no depender de la zona horaria de la máquina que corre los tests.
//
// Fechas usadas (2026): 7 sep = lunes, 11 sep = viernes, 12 sep = sábado,
// 13 sep = domingo.
const utc = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, min));

afterEach(() => {
  for (const key of Object.keys(HOLIDAY_OVERRIDES)) delete HOLIDAY_OVERRIDES[key];
});

describe("isOpenNow — bordes del horario", () => {
  it("lunes 08:59 RD: cerrado (falta un minuto para abrir)", () => {
    expect(isOpenNow(utc(2026, 9, 7, 12, 59)).open).toBe(false);
  });

  it("lunes 09:00 RD: abierto (minuto exacto de apertura)", () => {
    expect(isOpenNow(utc(2026, 9, 7, 13, 0)).open).toBe(true);
  });

  it("lunes 18:59 RD: abierto (último minuto)", () => {
    expect(isOpenNow(utc(2026, 9, 7, 22, 59)).open).toBe(true);
  });

  it("lunes 19:00 RD: cerrado (el cierre no es inclusivo)", () => {
    expect(isOpenNow(utc(2026, 9, 7, 23, 0)).open).toBe(false);
  });

  it("jueves 19:00 RD: cerrado (último día del horario corto)", () => {
    expect(isOpenNow(utc(2026, 9, 10, 23, 0)).open).toBe(false);
  });

  it("viernes 19:00 RD: abierto (el fin de semana cierra a las 22)", () => {
    expect(isOpenNow(utc(2026, 9, 11, 23, 0)).open).toBe(true);
  });

  it("viernes 21:59 RD: abierto, aunque en UTC ya sea sábado", () => {
    // 12 sep 01:59 UTC = 11 sep 21:59 RD
    expect(isOpenNow(utc(2026, 9, 12, 1, 59)).open).toBe(true);
  });

  it("viernes 22:00 RD: cerrado", () => {
    expect(isOpenNow(utc(2026, 9, 12, 2, 0)).open).toBe(false);
  });

  it("sábado 09:00 RD: abierto", () => {
    expect(isOpenNow(utc(2026, 9, 12, 13, 0)).open).toBe(true);
  });

  it("domingo 21:59 RD: abierto (domingo también cierra a las 22)", () => {
    expect(isOpenNow(utc(2026, 9, 14, 1, 59)).open).toBe(true);
  });

  it("madrugada del lunes 03:00 RD: cerrado", () => {
    expect(isOpenNow(utc(2026, 9, 7, 7, 0)).open).toBe(false);
  });

  it("devuelve siempre el texto del horario", () => {
    expect(isOpenNow(utc(2026, 9, 7, 13, 0)).schedule).toContain("Lunes a jueves");
  });
});

describe("isOpenNow — excepciones por fecha", () => {
  it("feriado (null): cerrado incluso al mediodía", () => {
    HOLIDAY_OVERRIDES["2026-09-07"] = null;
    expect(isOpenNow(utc(2026, 9, 7, 16, 0)).open).toBe(false);
  });

  it("horario especial: abierto justo antes del cierre adelantado", () => {
    HOLIDAY_OVERRIDES["2026-09-07"] = { open: 9, close: 16 };
    // 19:59 UTC = 15:59 RD
    expect(isOpenNow(utc(2026, 9, 7, 19, 59)).open).toBe(true);
  });

  it("horario especial: cerrado en el minuto del cierre adelantado", () => {
    HOLIDAY_OVERRIDES["2026-09-07"] = { open: 9, close: 16 };
    expect(isOpenNow(utc(2026, 9, 7, 20, 0)).open).toBe(false);
  });

  it("la excepción aplica al día RD, no al día UTC", () => {
    // 12 sep 01:00 UTC = 11 sep 21:00 RD -> manda la excepción del día 11
    HOLIDAY_OVERRIDES["2026-09-11"] = null;
    expect(isOpenNow(utc(2026, 9, 12, 1, 0)).open).toBe(false);
  });

  it("una excepción de otro día no afecta al día consultado", () => {
    HOLIDAY_OVERRIDES["2026-09-08"] = null;
    expect(isOpenNow(utc(2026, 9, 7, 16, 0)).open).toBe(true);
  });
});
