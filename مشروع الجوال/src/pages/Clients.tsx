import { useEffect, useMemo, useState } from "react";
import MobileHeader from "@/components/MobileHeader";
import AppShell from "@/components/AppShell";
import ListTile from "@/components/ListTile";
import { UserService } from "@/services/userService";
import type { ClientSummary } from "@/types";
import { fallbackClients } from "@/data/sampleData";

const channelLabel: Record<NonNullable<ClientSummary["preferredChannel"]>, string> = {
  whatsapp: "واتساب",
  email: "بريد إلكتروني",
  phone: "اتصال هاتفي"
};

const Clients = () => {
  const [clients, setClients] = useState<ClientSummary[]>(fallbackClients);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await UserService.getClients();
        if (response?.length) {
          const normalized: ClientSummary[] = response.map((client) => {
            const snake = (client as unknown as { last_login_at?: string }).last_login_at;
            const camel = (client as unknown as { lastLoginAt?: Date | string }).lastLoginAt;

            let lastInteraction: string | undefined;
            if (snake) {
              lastInteraction = snake;
            } else if (camel instanceof Date) {
              lastInteraction = camel.toISOString();
            } else if (typeof camel === "string") {
              lastInteraction = camel;
            }

            return {
              id: String(client.id),
              name: client.name,
              phone: client.phone,
              email: client.email,
              activeCases: 0,
              lastInteraction,
              preferredChannel: "email"
            } satisfies ClientSummary;
          });
          setClients(normalized);
        }
      } catch (error) {
        console.warn("Falling back to sample clients", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (!search.trim()) {
        return true;
      }
      return (
        client.name.includes(search) ||
        client.phone?.includes(search) ||
        client.email?.includes(search || "")
      );
    });
  }, [clients, search]);

  return (
    <AppShell
      header={<MobileHeader title="العملاء" subtitle={loading ? "جاري المزامنة" : "آخر تحديث"} />}
    >
      <input
        type="search"
        placeholder="ابحث باسم العميل"
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <section className="space-y-3">
        {filteredClients.map((client) => (
          <ListTile
            key={client.id}
            title={client.name}
            subtitle={client.phone ?? client.email ?? "لا توجد بيانات اتصال"}
            meta={`قضايا نشطة: ${client.activeCases}`}
            footer={`القناة المفضلة: ${client.preferredChannel ? channelLabel[client.preferredChannel] : "غير محدد"}`}
            onClick={() => console.log("open client", client.id)}
          />
        ))}
        {filteredClients.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">لا يوجد عملاء مطابقون للبحث.</p>
        ) : null}
      </section>
    </AppShell>
  );
};

export default Clients;
