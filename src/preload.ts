/**
 * Debe importarse antes que AppModule para que el orden DNS aplique al conectar Postgres.
 * No arregla redes solo-IPv4 si el host solo publica AAAA (caso típico de db.*.supabase.co):
 * ahí usa la URI del pooler (Connect en Supabase).
 */
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
