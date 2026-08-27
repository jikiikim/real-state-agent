"use client";

import { useEffect, useState } from "react";
import type { ApartmentSummary, ComplexInfo } from "@/lib/property-recommendation";

interface ComplexInfoState {
  data: ComplexInfo | null;
  loading: boolean;
  error: string | null;
}

/** 아파트의 단지 정보(세대수·동수·사용승인일)를 온디맨드로 조회한다. */
export function useComplexInfo(apartment: ApartmentSummary): ComplexInfoState {
  const [state, setState] = useState<ComplexInfoState>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ data: null, loading: true, error: null });

      const params = new URLSearchParams({
        legalDongName: apartment.legalDongName,
        jibun: apartment.jibun,
        aptName: apartment.aptName,
      });
      if (apartment.regionName) params.set("regionName", apartment.regionName);

      try {
        const res = await fetch(`/api/apartment-complex-info?${params.toString()}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "단지 정보를 불러오지 못했습니다.");
        if (!cancelled) setState({ data: body as ComplexInfo | null, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apartment.aptSeq, apartment.legalDongName, apartment.jibun, apartment.aptName, apartment.regionName]);

  return state;
}
