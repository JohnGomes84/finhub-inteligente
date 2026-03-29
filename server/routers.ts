import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { cadastrosRouter } from "./routers/cadastros";
import { financeiroRouter } from "./routers/financeiro";
import { usuariosRouter } from "./routers/usuarios";
import { planejamentosRouter } from "./routers/planejamentos";
import { portalLiderRouter } from "./routers/portalLider";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Cadastros (Employees, Clients, Suppliers, Shifts, Functions, CostCenters, BankAccounts)
  cadastros: cadastrosRouter,

  // Financeiro (Accounts Payable/Receivable, Payment Batches, Dashboard KPIs)
  financeiro: financeiroRouter,

  // Planejamentos (Escalas de Trabalho)
  planejamentos: planejamentosRouter,

  // Gestão de Usuários e Permissões
  usuarios: usuariosRouter,

  // Portal do Líder
  portalLider: portalLiderRouter,
});

export type AppRouter = typeof appRouter;
