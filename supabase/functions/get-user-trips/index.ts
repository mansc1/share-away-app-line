import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateLineUser, getAuthIdentityValues } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getStatusRank = (status: string, isActive: boolean) => {
  if (isActive) return 0;
  if (status === "open" || status === "confirmed") return 1;
  return 2;
};

interface TripSummaryRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity_total: number;
  created_at: string | null;
}

interface MembershipRow {
  trip_id: string;
  role: string;
  trips: TripSummaryRow;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const user = await authenticateLineUser(supabase, req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const identityValues = getAuthIdentityValues(user);

    const [{ data: activeTrip }, { data: memberships, error: membershipErr }] = await Promise.all([
      supabase
        .from("user_active_trip")
        .select("trip_id")
        .in("user_id", identityValues)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("trip_members")
        .select(`
          trip_id,
          role,
          trips!inner(
            id,
            name,
            start_date,
            end_date,
            status,
            capacity_total,
            created_at
          )
        `)
        .in("user_id", identityValues),
    ]);

    if (membershipErr) {
      console.error("get-user-trips membership error:", membershipErr);
      return json({ error: "Failed to load trips" }, 500);
    }

    const rows = (memberships ?? []).map((membership: MembershipRow) => ({
      tripId: membership.trip_id as string,
      role: membership.role as string,
      trip: membership.trips,
    }));

    const tripIds = rows.map((row) => row.tripId);

    const memberCountMap = new Map<string, number>();
    if (tripIds.length > 0) {
      const { data: tripMembers, error: countErr } = await supabase
        .from("trip_members")
        .select("trip_id")
        .in("trip_id", tripIds);

      if (countErr) {
        console.error("get-user-trips count error:", countErr);
        return json({ error: "Failed to load member counts" }, 500);
      }

      for (const row of tripMembers ?? []) {
        memberCountMap.set(row.trip_id, (memberCountMap.get(row.trip_id) ?? 0) + 1);
      }
    }

    const activeTripId = activeTrip?.trip_id ?? null;
    const trips = rows
      .map(({ tripId, role, trip }) => ({
        id: trip.id,
        name: trip.name,
        start_date: trip.start_date,
        end_date: trip.end_date,
        status: trip.status,
        capacity_total: trip.capacity_total,
        role,
        member_count: memberCountMap.get(tripId) ?? 0,
        created_at: trip.created_at ?? null,
        is_active: trip.id === activeTripId,
      }))
      .sort((a, b) => {
        const rankDiff = getStatusRank(a.status, a.is_active) - getStatusRank(b.status, b.is_active);
        if (rankDiff !== 0) return rankDiff;

        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return createdB - createdA;
      });

    return json({ trips });
  } catch (err) {
    console.error("get-user-trips error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
