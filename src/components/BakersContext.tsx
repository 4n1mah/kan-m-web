"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type TeamMember = { id: string; name: string; role: "OWNER" | "BAKER" | "ASSISTANT" };

type BakersContextValue = {
  /** Todos los miembros activos del equipo (OWNER, BAKER, ASSISTANT). */
  teamMembers: TeamMember[];
  /** Solo nombres de OWNER y BAKER — para el filtro por repostera. */
  bakers: string[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const BakersContext = createContext<BakersContextValue>({
  teamMembers: [],
  bakers: [],
  loading: false,
  refresh: async () => {},
});

export function BakersProvider({ children }: { children: ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/bakers");
      if (r.ok) {
        const data = await r.json();
        const members: TeamMember[] = (Array.isArray(data) ? data : []).filter(
          (u: unknown): u is TeamMember =>
            typeof u === "object" && u !== null &&
            typeof (u as TeamMember).name === "string" &&
            ["OWNER", "BAKER", "ASSISTANT"].includes((u as TeamMember).role)
        );
        setTeamMembers(members);
      }
    } catch {
      // Mantener estado vacío al haber error de red.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const bakers = teamMembers
    .filter(m => m.role === "OWNER" || m.role === "BAKER")
    .map(m => m.name);

  return (
    <BakersContext.Provider value={{ teamMembers, bakers, loading, refresh }}>
      {children}
    </BakersContext.Provider>
  );
}

export function useBakers() {
  return useContext(BakersContext);
}
