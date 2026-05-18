import { ROL_ID_CLIENTE } from '../../modules/logistica/logistica-rol.constants';
import { TIPO_DOCUMENTO_ID_CEDULA } from '../../modules/logistica/logistica-tipo-documento.constants';
import { SWAGGER_EJEMPLO_CORREO, SWAGGER_EJEMPLO_PASSWORD } from '../swagger-ejemplos';

/** POST /auth/register — Cliente (rol 1) con cédula de ciudadanía (tipo documento 1). */
export const EJEMPLO_REGISTER_CLIENTE_CEDULA = {
  correo: SWAGGER_EJEMPLO_CORREO,
  password: SWAGGER_EJEMPLO_PASSWORD,
  nombres: 'Juan',
  apellidos: 'García',
  fkTipoDocumento: TIPO_DOCUMENTO_ID_CEDULA,
  documento: '1020304050',
  telefono: '3001234567',
  idRol: ROL_ID_CLIENTE,
};
