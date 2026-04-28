/**
 * BRIEF_TEMPLATES
 *
 * Catálogo de plantillas disponibles para inicializar un brief.
 * El owner elige una al entrar a la pestaña Brief cuando aún no existe.
 *
 * Estructura de cada entrada:
 *   {
 *     id:          string             — clave única usada como key en el objeto
 *     name:        string             — nombre visible en el selector
 *     description: string             — descripción corta (max ~80 chars)
 *     icon:        string             — emoji representativo
 *     template:    { sections: [...] }  — estructura de template_json
 *   }
 *
 * Tipos de campo soportados: "text" | "email" | "textarea" | "date"
 */
export const BRIEF_TEMPLATES = {

  // ── Proyecto Web ─────────────────────────────────────────────────────────────
  web: {
    id:          'web',
    name:        'Proyecto Web',
    description: 'Ideal para sitios web corporativos, portafolios o plataformas con múltiples páginas.',
    icon:        '🌐',
    template: {
      sections: [
        {
          title: 'Información general',
          fields: [
            { id: 'project_name',   type: 'text',     label: 'Nombre del proyecto',   required: true },
            { id: 'company_name',   type: 'text',     label: 'Nombre de la empresa' },
            { id: 'contact_name',   type: 'text',     label: 'Persona de contacto' },
            { id: 'contact_email',  type: 'email',    label: 'Correo electrónico' },
            { id: 'website_url',    type: 'text',     label: 'Sitio web actual (si existe)' },
          ],
        },
        {
          title: 'Objetivo del proyecto',
          fields: [
            { id: 'project_goal',     type: 'textarea', label: '¿Cuál es el objetivo principal del sitio?' },
            { id: 'target_audience',  type: 'textarea', label: '¿Quién es tu público objetivo?' },
            { id: 'competitors',      type: 'textarea', label: 'Sitios de la competencia o referencia' },
          ],
        },
        {
          title: 'Contenido y funcionalidades',
          fields: [
            { id: 'pages',         type: 'textarea', label: 'Páginas o secciones requeridas' },
            { id: 'features',      type: 'textarea', label: 'Funcionalidades especiales (formularios, mapas, etc.)' },
            { id: 'languages',     type: 'text',     label: 'Idiomas del sitio' },
            { id: 'integrations',  type: 'textarea', label: 'Integraciones (CRM, Analytics, redes sociales…)' },
          ],
        },
        {
          title: 'Diseño',
          fields: [
            { id: 'style',      type: 'textarea', label: 'Estilo visual deseado' },
            { id: 'colors',     type: 'text',     label: 'Colores de marca' },
            { id: 'references', type: 'textarea', label: 'Referencias visuales o sitios que te gustan' },
            { id: 'assets',     type: 'textarea', label: '¿Tienes logo, fotos o materiales de marca?' },
          ],
        },
        {
          title: 'Plazos y presupuesto',
          fields: [
            { id: 'deadline',  type: 'date',     label: 'Fecha estimada de entrega' },
            { id: 'budget',    type: 'text',     label: 'Presupuesto aproximado' },
            { id: 'priority',  type: 'textarea', label: 'Prioridades o restricciones del proyecto' },
          ],
        },
      ],
    },
  },

  // ── Ecommerce ─────────────────────────────────────────────────────────────────
  ecommerce: {
    id:          'ecommerce',
    name:        'Ecommerce',
    description: 'Para tiendas online, catálogos de productos y plataformas de venta.',
    icon:        '🛒',
    template: {
      sections: [
        {
          title: 'Información general',
          fields: [
            { id: 'project_name',   type: 'text',  label: 'Nombre de la tienda',  required: true },
            { id: 'company_name',   type: 'text',  label: 'Nombre de la empresa' },
            { id: 'contact_name',   type: 'text',  label: 'Persona de contacto' },
            { id: 'contact_email',  type: 'email', label: 'Correo electrónico' },
          ],
        },
        {
          title: 'Catálogo y productos',
          fields: [
            { id: 'product_types',    type: 'textarea', label: 'Tipos de productos que se venderán' },
            { id: 'product_count',    type: 'text',     label: 'Cantidad aproximada de productos' },
            { id: 'variants',         type: 'textarea', label: '¿Los productos tienen variantes (talla, color, etc.)?' },
            { id: 'digital_products', type: 'textarea', label: '¿Se venderán productos digitales o descargables?' },
          ],
        },
        {
          title: 'Pagos y envíos',
          fields: [
            { id: 'payment_methods', type: 'textarea', label: 'Métodos de pago requeridos' },
            { id: 'shipping',        type: 'textarea', label: '¿Cómo se gestionarán los envíos?' },
            { id: 'currencies',      type: 'text',     label: 'Monedas y países de venta' },
          ],
        },
        {
          title: 'Funcionalidades',
          fields: [
            { id: 'features',       type: 'textarea', label: 'Funcionalidades necesarias (cupones, wishlist, reviews…)' },
            { id: 'integrations',   type: 'textarea', label: 'Integraciones (ERP, inventario, email marketing…)' },
            { id: 'existing_store', type: 'text',     label: 'Plataforma actual (si existe)' },
          ],
        },
        {
          title: 'Diseño',
          fields: [
            { id: 'style',      type: 'textarea', label: 'Estilo visual deseado' },
            { id: 'colors',     type: 'text',     label: 'Colores de marca' },
            { id: 'references', type: 'textarea', label: 'Tiendas de referencia' },
          ],
        },
        {
          title: 'Plazos y presupuesto',
          fields: [
            { id: 'deadline', type: 'date', label: 'Fecha estimada de lanzamiento' },
            { id: 'budget',   type: 'text', label: 'Presupuesto aproximado' },
          ],
        },
      ],
    },
  },

  // ── Aplicación Web ────────────────────────────────────────────────────────────
  app: {
    id:          'app',
    name:        'Aplicación Web',
    description: 'Para SaaS, dashboards, plataformas con autenticación y lógica de negocio compleja.',
    icon:        '⚙️',
    template: {
      sections: [
        {
          title: 'Información general',
          fields: [
            { id: 'project_name',   type: 'text',     label: 'Nombre de la aplicación',  required: true },
            { id: 'company_name',   type: 'text',     label: 'Nombre de la empresa' },
            { id: 'contact_name',   type: 'text',     label: 'Persona de contacto' },
            { id: 'contact_email',  type: 'email',    label: 'Correo electrónico' },
          ],
        },
        {
          title: 'Contexto y objetivo',
          fields: [
            { id: 'problem',         type: 'textarea', label: '¿Qué problema resuelve la aplicación?' },
            { id: 'target_users',    type: 'textarea', label: '¿Quiénes serán los usuarios?' },
            { id: 'user_roles',      type: 'textarea', label: 'Roles de usuario (admin, cliente, agente…)' },
            { id: 'competitors',     type: 'textarea', label: 'Aplicaciones similares o de referencia' },
          ],
        },
        {
          title: 'Funcionalidades',
          fields: [
            { id: 'core_features',   type: 'textarea', label: 'Funcionalidades principales (MVP)' },
            { id: 'nice_to_have',    type: 'textarea', label: 'Funcionalidades deseables (fase 2)' },
            { id: 'auth',            type: 'textarea', label: '¿Cómo se autenticarán los usuarios?' },
            { id: 'notifications',   type: 'textarea', label: '¿Se requieren notificaciones? (email, push, in-app)' },
          ],
        },
        {
          title: 'Datos e integraciones',
          fields: [
            { id: 'data_model',     type: 'textarea', label: 'Entidades o datos principales que maneja la app' },
            { id: 'integrations',   type: 'textarea', label: 'APIs o servicios externos a conectar' },
            { id: 'existing_stack', type: 'textarea', label: 'Stack tecnológico existente o preferido' },
          ],
        },
        {
          title: 'Diseño',
          fields: [
            { id: 'style',      type: 'textarea', label: 'Estilo visual deseado' },
            { id: 'references', type: 'textarea', label: 'Apps de referencia visual' },
            { id: 'branding',   type: 'textarea', label: '¿Tienes guía de marca o design system?' },
          ],
        },
        {
          title: 'Plazos y presupuesto',
          fields: [
            { id: 'deadline',    type: 'date',     label: 'Fecha estimada de entrega del MVP' },
            { id: 'budget',      type: 'text',     label: 'Presupuesto aproximado' },
            { id: 'constraints', type: 'textarea', label: 'Restricciones técnicas o de negocio importantes' },
          ],
        },
      ],
    },
  },

  // ── Landing Page ──────────────────────────────────────────────────────────────
  landing: {
    id:          'landing',
    name:        'Landing Page',
    description: 'Página de aterrizaje para campañas, lanzamientos de producto o captación de leads.',
    icon:        '🚀',
    template: {
      sections: [
        {
          title: 'Información general',
          fields: [
            { id: 'project_name',   type: 'text',  label: 'Nombre del proyecto',  required: true },
            { id: 'company_name',   type: 'text',  label: 'Nombre de la empresa' },
            { id: 'contact_name',   type: 'text',  label: 'Persona de contacto' },
            { id: 'contact_email',  type: 'email', label: 'Correo electrónico' },
          ],
        },
        {
          title: 'Objetivo de la campaña',
          fields: [
            { id: 'campaign_goal',  type: 'textarea', label: '¿Cuál es el objetivo de la landing? (ventas, leads, descarga…)' },
            { id: 'cta',            type: 'text',     label: 'Call to action principal' },
            { id: 'offer',          type: 'textarea', label: '¿Qué se ofrece al visitante?' },
            { id: 'audience',       type: 'textarea', label: '¿A quién va dirigida?' },
          ],
        },
        {
          title: 'Contenido',
          fields: [
            { id: 'headline',    type: 'text',     label: 'Titular principal (propuesta de valor)' },
            { id: 'sections',    type: 'textarea', label: 'Secciones o bloques de contenido' },
            { id: 'testimonials',type: 'textarea', label: '¿Se incluirán testimonios o casos de éxito?' },
            { id: 'faq',         type: 'textarea', label: '¿Se incluirá sección de preguntas frecuentes?' },
          ],
        },
        {
          title: 'Diseño',
          fields: [
            { id: 'style',      type: 'textarea', label: 'Estilo visual deseado' },
            { id: 'colors',     type: 'text',     label: 'Colores de marca' },
            { id: 'references', type: 'textarea', label: 'Landings de referencia' },
            { id: 'assets',     type: 'textarea', label: '¿Tienes imágenes, videos o materiales listos?' },
          ],
        },
        {
          title: 'Plazos',
          fields: [
            { id: 'launch_date', type: 'date', label: 'Fecha de lanzamiento de la campaña' },
            { id: 'budget',      type: 'text', label: 'Presupuesto aproximado' },
          ],
        },
      ],
    },
  },

  // ── Brief en blanco ───────────────────────────────────────────────────────────
  blank: {
    id:          'blank',
    name:        'Brief en blanco',
    description: 'Empieza desde cero. Ideal para proyectos que no encajan en ninguna categoría.',
    icon:        '📄',
    template: {
      sections: [
        {
          title: 'Información general',
          fields: [
            { id: 'project_name',   type: 'text',     label: 'Nombre del proyecto',   required: true },
            { id: 'contact_name',   type: 'text',     label: 'Persona de contacto' },
            { id: 'contact_email',  type: 'email',    label: 'Correo electrónico' },
          ],
        },
        {
          title: 'Descripción del proyecto',
          fields: [
            { id: 'description', type: 'textarea', label: 'Descripción general del proyecto' },
            { id: 'goals',       type: 'textarea', label: 'Objetivos principales' },
          ],
        },
        {
          title: 'Plazos',
          fields: [
            { id: 'deadline', type: 'date', label: 'Fecha estimada de entrega' },
          ],
        },
      ],
    },
  },
}

// ─── Backward-compat export ───────────────────────────────────────────────────
// briefSupabase.js importaba DEFAULT_BRIEF_TEMPLATE; se mantiene como alias al
// blank para que cualquier llamada residual no rompa.
export const DEFAULT_BRIEF_TEMPLATE = BRIEF_TEMPLATES.blank.template
