const nodemailer = require('nodemailer');

// ¿Hay credenciales SMTP configuradas en el .env?
const smtpConfigurado = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

// El "transporter" es el objeto de Nodemailer que sabe conectarse al servidor de correo.
// Solo se crea si hay configuración; si no, trabajamos en "modo desarrollo".
const transporter = smtpConfigurado
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true solo para el puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  : null;

// Envía un mail. Si no hay SMTP configurado (desarrollo), imprime el mensaje
// en la consola del servidor para poder probar el flujo sin enviar nada real.
async function enviarMail({ para, asunto, texto }) {
  if (!transporter) {
    console.log('--- [MAIL SIMULADO: SMTP no configurado] ---');
    console.log(`Para: ${para}`);
    console.log(`Asunto: ${asunto}`);
    console.log(texto);
    console.log('--------------------------------------------');
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    subject: asunto,
    text: texto,
  });
}

// RN09: mail con el código de confirmación de registro (válido 5 minutos).
async function enviarCodigoConfirmacion(email, codigo) {
  await enviarMail({
    para: email,
    asunto: 'Barberazo - Confirmá tu registro',
    texto: `Tu código de confirmación es: ${codigo}\n\nEs válido por 5 minutos.`,
  });
}

// CUU3.1: mail con el código para recuperar la contraseña.
async function enviarCodigoRecuperacion(email, codigo) {
  await enviarMail({
    para: email,
    asunto: 'Barberazo - Recuperar contraseña',
    texto: `Tu código para recuperar la contraseña es: ${codigo}\n\nEs válido por 5 minutos. Si no lo pediste vos, ignorá este mensaje.`,
  });
}

module.exports = { enviarCodigoConfirmacion, enviarCodigoRecuperacion };
