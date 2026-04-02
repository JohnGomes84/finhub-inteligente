/**
 * FINHUB — Security Headers (Cabeçalhos de Segurança)
 * 
 * Implementa headers HTTP de segurança básicos sem dependências externas.
 * Protege contra: clickjacking, XSS, MIME type sniffing, etc.
 * 
 * Uso:
 * app.use(securityHeaders());
 */

import { Request, Response, NextFunction } from 'express';

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // HSTS: Force HTTPS por 1 ano
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // X-Frame-Options: Previne clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options: Previne MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection: Ativa proteção XSS do navegador
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy: Controla informação de referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy: Controla features do navegador
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    next();
  };
}
