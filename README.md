Sabor Caribeño — Mojarritas

Cocina caribeña auténtica, en tu casa.

Plataforma web que conecta a personas interesadas en la cultura caribeña con chefs caribeños verificados, que llegan al hogar del usuario a cocinar en vivo. El usuario reserva, paga y sigue su experiencia sin salir de casa.

1. Problema

Muchas personas de entre 20 y 40 años quieren conocer la cultura caribeña a través de su gastronomía, pero prefieren no salir de casa por falta de tiempo o por comodidad. Viajar, ir a restaurantes o pedir domicilio implican desplazarse o se quedan en probar un plato sin vivir la cultura. Además, no cualquiera deja entrar a un chef desconocido a su casa, y el idioma, el precio y la poca disponibilidad de chefs dificultan la experiencia. Falta una forma de llevar una experiencia caribeña auténtica y segura directamente al hogar.

Necesidades
Conocer y disfrutar la cultura caribeña, especialmente su comida, desde un lugar cómodo.
Sentirse seguro al recibir a un chef en su propio espacio.
Dificultades
Viajar o ir a restaurantes exige salir de casa, justo lo que este público prefiere evitar.
Pedir comida a domicilio permite probar los platos, pero no ofrece una experiencia cultural completa.
Dejar entrar a un chef desconocido genera desconfianza si no hay verificación de identidad y certificación.
El idioma, el precio y la disponibilidad de chefs en cada ciudad pueden hacer difícil conseguir la experiencia.
Algunos ingredientes caribeños son escasos o costosos fuera del Caribe, lo que encarece el servicio.
Expectativas
Contar con chefs caribeños verificados y con certificación culinaria.
Reservar y pagar de forma sencilla, con el precio claro desde el inicio.
Comunicarse sin barreras de idioma y coordinar un horario que se ajuste a su tiempo.
Vivir una experiencia cultural auténtica, no solo recibir comida.
Alternativas actuales
Plataforma	Fortaleza	Limitación frente a este público
Eatwithme	Experiencias gastronómicas en hogares privados, con enfoque en el intercambio cultural	No se enfoca en cultura caribeña ni en chefs caribeños verificados que lleguen al hogar del usuario
Timeleft	Organiza cenas entre desconocidos sin que el usuario planee nada	Prioriza la conexión social sobre la experiencia cultural o gastronómica en casa
Meetup	Gran variedad de grupos y actividades, incluidas cultura y gastronomía	Las actividades son presenciales y obligan a desplazarse

Ninguna reúne en un mismo servicio chefs caribeños verificados, seguridad, comunicación clara, disponibilidad y una experiencia cultural auténtica desde casa.

2. Insight

2 de 5 personas entendieron la app como un servicio de entrega de comida (tipo Rappi), no como un chef que cocina en vivo en casa. Un "error de interpretación" repetido no es ruido: es una demanda oculta que el equipo no había planeado cubrir.

Esto obliga a comunicar desde el primer vistazo que el chef llega a cocinar al hogar, y abre la puerta a explorar la comida caribeña a domicilio como una línea de servicio adicional en futuras versiones.

3. Concepto de solución

Una aplicación web que conecta a personas interesadas en la cultura caribeña con chefs caribeños verificados, y facilita la reserva, el pago y el seguimiento del servicio. Se vende una experiencia cultural segura en casa, no solo comida.

Característica	Atributo
Confianza y seguridad	Chefs con identidad y certificación culinaria verificadas, y perfil del comprador visible solo tras aceptar el pedido
Autenticidad	Chefs caribeños con perfil, publicaciones, años de experiencia y reseñas
Sencillez	Reserva y pago en pocos pasos, con desglose claro del precio
Accesibilidad	Precios en USD, EUR y COP, y filtros por plato, ciudad y rango de precio
Comunicación	Contacto directo con el chef por WhatsApp y avisos de cada fase del pedido
4. MVP

Se valida primero con datos simulados y un registro real en hoja de cálculo, sin construir la plataforma completa.

Componente	Cómo funciona
Catálogo de chefs	Lista filtrable por búsqueda de plato y rango de precio, con perfiles simulados
Perfil del chef	Insignias de confianza, especialidad, certificación, publicaciones, reseñas y WhatsApp
Reserva	Fecha, hora, comensales y dirección, validando la agenda y el horario del chef
Pago	Resumen con menú, ingredientes y transporte, y tarifa de servicio; el cobro es una simulación
Panel del chef	Aceptar, denegar y completar pedidos, bloquear días en la agenda y publicar su trabajo
Seguimiento	Cuatro fases: reserva confirmada, chef aceptó, chef en camino, chef llegó
Base de datos	Cuentas y reservas llegan a una hoja de cálculo de Google
Ayuda	Mini tutorial según el rol (comprador o chef)
Hipótesis a validar
Las personas están dispuestas a pagar por recibir a un chef caribeño en casa si hay verificación y seguridad.
Hay suficientes chefs caribeños dispuestos a registrarse y atender en varias ciudades.
La propuesta se entiende como un chef que cocina en vivo y no como un servicio de entrega de comida.
Métricas de éxito
Proporción de usuarios que entiende correctamente la propuesta de valor.
Reservas completadas frente a reservas iniciadas.
Pedidos aceptados por los chefs.
Calificación promedio de las reseñas y usuarios que repiten.
Riesgo principal

La oferta de chefs por ciudad y el costo de los ingredientes caribeños fuera del Caribe pueden limitar la disponibilidad y encarecer la experiencia. En el piloto se medirá qué ciudades tienen oferta suficiente y cómo afecta el precio a la conversión.

5. Estructura
├── index.html            la app (estructura de la página)
├── proyecto.html         página que presenta el proyecto
├── css/
│   ├── styles.css        estilos de la app
│   └── proyecto.css      estilos de la página del proyecto
├── js/
│   ├── 1-base.js         utilidades, estado, monedas y reservas
│   ├── 2-datos.js        chefs, platos, ofertas y ubicación
│   ├── 3-ui.js           cabecera, ventanas y buscador
│   ├── 4-inicio.js       inicio
│   ├── 5-resultados.js   lista de chefs y mapa
│   ├── 6-perfil.js       perfil del chef y reserva
│   ├── 7-pago.js         pago y confirmación
│   ├── 8-cuentas.js      registro e inicio de sesión
│   ├── 9-chef.js         panel del chef
│   ├── 10-platos.js      buscador de platos
│   ├── ampliar.js        zoom de fotos
│   ├── ayuda.js          mini tutorial
│   ├── sheets.js         conexión con Google Sheets y correos
│   └── arranque.js       restauración de sesión (debe cargarse al final)
├── apps-script/
│   └── Codigo.gs         script de Google Apps Script
├── assets/               logos y fotos de platos
└── README.md             este documento

El orden de los archivos .js importa: arranque.js debe cargarse al final.

6. Tecnologías
HTML: estructura de las páginas.
CSS: colores, tipografías y diseño adaptable a celular.
JavaScript: catálogo, reservas, seguimiento y envío de datos, sin frameworks.
Google Sheets y Apps Script: base de datos de cuentas y reservas, y envío de correos.
Almacenamiento del navegador: datos de la sesión durante el MVP.
GitHub: publicación de la app.
