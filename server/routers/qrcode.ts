import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import QRCode from "qrcode";

export const qrcodeRouter = router({
  // ============ GERAR QR CODE DE PRE-CADASTRO ============
  generatePreRegisterQR: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .query(async ({ input }) => {
      try {
        const baseUrl = process.env.VITE_API_URL || "http://localhost:5173";
        const preRegisterUrl = `${baseUrl}/pre-register?scheduleId=${input.scheduleId}`;
        const qrCode = await QRCode.toDataURL(preRegisterUrl);
        return { qrCode, url: preRegisterUrl };
      } catch (error) {
        return { qrCode: null, url: null, error: "Falha ao gerar QR code" };
      }
    }),
});
