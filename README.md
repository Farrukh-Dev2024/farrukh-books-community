📘 Farrukh Books

A production-grade multi-tenant SaaS Accounting & ERP platform built with modern full-stack architecture.

✨ About The Project

Farrukh Books is a modern accounting & ERP system designed with strict multi-tenant isolation and scalable SaaS architecture.

It provides:

- Double-entry accounting
- Inventory & order management
- Payroll automation
- Role-based access control
- Secure company isolation
- Encrypted backup system [This feature is not available in community version]

This project demonstrates real-world SaaS engineering principles using the latest web technologies.

🏗 Tech Stack
- Frontend
  - Next.js 16 (App Router)
  - React 19
  - TypeScript (Strict Mode)
  - TailwindCSS
  - shadcn/ui
  - motion

- Backend
  - Next.js Server Actions
  - Prisma ORM v7
  - PostgreSQL
  - NextAuth v5
  - bcryptjs
  - Zod

🔐 Security & Architecture

Multi-tenant company isolation
- Role-based access control (RBAC)
- Secure session management
- Strict type safety (no any)
- Server-side mutations only
- Input validation via Zod
- Encrypted backup mechanism

📦 Features

🏢 Company Management

- Multi-company SaaS support
- Business type configuration
- Secure company-level separation

📊 Accounting

- Chart of accounts
- Journal entries
- General ledger
- Trial balance
- Profit & Loss
- Balance sheet
- Automated ledger posting

📦 Inventory & Operations

- Product management
- Customer & vendor tracking
- Sales & purchase orders
- Stock control
- Automated accounting integration

👥 HR & Payroll

- Employee management
- Attendance tracking
- Salary structures
- Payroll runs
- Payslip generation
- Automated payroll journal entries

💾 Backup System [This feature is not available in community version]

- Encrypted company backups
- Secure restore functionality
- Admin-controlled access


Modular feature-based architecture ensures scalability and maintainability.

🚀 Getting Started
1️⃣ Clone the repository
git clone https://github.com/Farrukh-Dev2024/farrukh-books.git
cd farrukh-books

2️⃣ Install dependencies
pnpm install

3️⃣ Setup environment variables

Create a .env file:

DATABASE_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
AUTH_TRUST_HOST=true
DB_SECRET=

4️⃣ Run database migrations
pnpm prisma migrate dev
pnpm prisma db seed

5️⃣ Start development server
pnpm dev

🧪 Scripts
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm prisma studio
pnpm lint

🎯 Design Philosophy

- Security-first development
- Strict type safety
- Feature-based modular structure
- SaaS-ready architecture
- Clean separation of concerns
- Real-world accounting logic

📈 Roadmap

 - Multi-currency support
 - Audit logs system
 - Subscription billing integration
 - API integrations
 - Advanced financial analytics
 - AI-powered reporting

🤝 Contributing

Currently maintained by Farrukh Dev.

Contributions are welcome for:

UI improvements
- Code optimizations
- Performance improvements
- Documentation enhancements

Please open an issue before submitting a PR.

🛡 License

This project is currently private and not licensed for redistribution.

👨‍💻 Author

Farrukh Dev

GitHub: https://github.com/Farrukh-Dev2024

Portfolio: https://farrukh.consologist.com
           https://farrukh-website.vercel.app/

FreeServer for users: https://farrukhbooks.com           