# Folder Structure — Milk Diary (MERN)

```
milk-diary/
├── client/                              # React (Vite) app — Admin + Customer, or split further if needed
│   ├── public/
│   │   ├── icons/                       # PWA icons
│   │   └── service-worker.js            # Web Push handling
│   ├── src/
│   │   ├── assets/
│   │   ├── api/                         # axios instances + endpoint functions
│   │   │   ├── axiosClient.js
│   │   │   ├── customerApi.js
│   │   │   ├── adminApi.js
│   │   │   └── billingApi.js
│   │   ├── sockets/
│   │   │   └── socketClient.js
│   │   ├── components/
│   │   │   ├── common/                  # Button, Card, Modal, Loader
│   │   │   ├── MonthlyCard/             # shared card component (admin + customer)
│   │   │   ├── QuickAddButton/
│   │   │   └── AreaGroupList/
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   │   ├── overview/
│   │   │   │   ├── customers/
│   │   │   │   │   ├── CustomerList.jsx
│   │   │   │   │   ├── CustomerForm.jsx
│   │   │   │   │   └── CustomerProfile.jsx
│   │   │   │   ├── quickAdd/
│   │   │   │   └── billing/
│   │   │   └── customer/
│   │   │       ├── activation/
│   │   │       └── overview/
│   │   ├── hooks/                       # useSocket, useAuth, usePush
│   │   ├── context/                     # AuthContext, SocketContext
│   │   ├── layouts/                     # AdminLayout (3 tabs), CustomerLayout
│   │   ├── routes/                      # AppRouter.jsx, ProtectedRoute.jsx
│   │   ├── utils/                       # date helpers, formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                              # Node + Express + Socket.IO
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                    # Mongoose connection
│   │   │   ├── socket.js                # Socket.IO init + room logic
│   │   │   └── webPush.js               # VAPID setup
│   │   ├── models/
│   │   │   ├── Admin.js
│   │   │   ├── Customer.js
│   │   │   ├── MilkEntry.js
│   │   │   ├── MilkPrice.js
│   │   │   └── Notification.js
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── customer.routes.js
│   │   │   ├── entries.routes.js
│   │   │   ├── billing.routes.js
│   │   │   └── push.routes.js
│   │   ├── controllers/
│   │   │   ├── admin.controller.js
│   │   │   ├── customer.controller.js
│   │   │   ├── entries.controller.js
│   │   │   ├── billing.controller.js
│   │   │   └── push.controller.js
│   │   ├── services/                    # business logic, called by controllers
│   │   │   ├── customer.service.js
│   │   │   ├── entries.service.js
│   │   │   ├── billing.service.js
│   │   │   └── push.service.js
│   │   ├── middlewares/
│   │   │   ├── authAdmin.js
│   │   │   ├── authCustomer.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js              # Zod/Joi schema runner
│   │   ├── validators/
│   │   │   ├── customer.validator.js
│   │   │   └── entries.validator.js
│   │   ├── sockets/
│   │   │   └── milk.socket.js           # "milk:add" handler, rooms
│   │   ├── utils/
│   │   │   ├── generateActivationCode.js
│   │   │   ├── dateHelpers.js
│   │   │   └── apiResponse.js
│   │   ├── app.js                       # express app setup
│   │   └── server.js                    # http server + socket.io bootstrap
│   ├── .env.example
│   └── package.json
│
├── requirement.md
├── description.md
├── rules.md
├── folder-structure.md
├── phases.md
└── README.md
```

## Notes
- `MonthlyCard` component lives once in `client/src/components/` and is reused by both Admin's `CustomerProfile` and Customer's `overview` page — per the strict rule against divergent implementations.
- `services/` layer keeps controllers thin; sockets and REST controllers both call into the same `entries.service.js` so quick-add logic isn't duplicated between the socket handler and the REST fallback endpoint.
- Split `client/` into two Vite apps only if the admin and customer UIs grow large enough to warrant separate deployments; for MVP, one app with role-based routing is simpler and faster to ship.
