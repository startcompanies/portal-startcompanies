# Panel - Panel Administrativo

Esta carpeta contiene el panel administrativo para clientes.

## Estructura

```
panel/
├── auth/                    # Componentes de autenticación
│   ├── login/              # Componente de inicio de sesión
│   ├── register/           # Componente de registro
│   └── reset-password/     # Componente de restablecimiento de contraseña
├── layout/                 # Layouts del panel
│   ├── auth-layout/        # Layout para páginas de autenticación
│   └── panel-layout/       # Layout principal del panel (con sidebar y header)
├── pages/                  # Páginas del panel
│   └── dashboard/          # Página principal del dashboard
├── guards/                # Guards de autenticación específicos del panel
└── services/              # Servicios específicos del panel
```

## Rutas

- `/panel/login` - Página de inicio de sesión
- `/panel/register` - Página de registro
- `/panel/reset-password` - Página de restablecimiento de contraseña
- `/panel/dashboard` - Dashboard principal del panel

## Características

### Layout de Autenticación
- Diseño centrado con fondo degradado
- Formularios con validación
- Navegación entre login, register y reset password

### Layout Principal del Panel
- Sidebar colapsable con menú de navegación
- Header con información del usuario
- Área de contenido principal
- Diseño responsive

### Dashboard
- Tarjetas de estadísticas
- Actividad reciente
- Acciones rápidas

## Estado

Estructura base implementada. Listo para agregar más páginas y funcionalidades.
