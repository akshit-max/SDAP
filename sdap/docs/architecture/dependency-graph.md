# Dependency Graph

```mermaid
graph TD
    %% Applications
    API(apps/api)
    Web(apps/web)
    Docs(apps/docs)

    %% Packages
    DB(@repo/db)
    Types(@repo/types)
    Config(@repo/config)
    Security(@repo/security)
    UI(@repo/ui)

    %% Relationships
    API --> DB
    API --> Types
    API --> Config
    API --> Security

    Web --> Types
    Web --> Config
    Web --> UI

    Docs --> UI

    %% Modules within API
    subgraph API Modules
        AuthModule --> UsersModule
        AuthModule --> TokenService
    end
```
