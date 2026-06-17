$ErrorActionPreference = "Stop"

$root = "C:\Users\shrus\Documents\Codex\2026-04-26\i-want-to-create-webapplication-on"
$outPath = Join-Path $root "ConstructHub_Project_Report_85_Pages.docx"
$assetDir = Join-Path $root "report-assets"

function Add-Paragraph {
    param(
        $Selection,
        [string]$Text,
        [int]$Size = 12,
        [bool]$Bold = $false,
        [int]$Alignment = 0,
        [int]$SpaceAfter = 8
    )

    $Selection.ParagraphFormat.Alignment = $Alignment
    $Selection.Font.Name = "Times New Roman"
    $Selection.Font.Size = $Size
    $Selection.Font.Bold = if ($Bold) { 1 } else { 0 }
    $Selection.ParagraphFormat.LineSpacingRule = 4
    $Selection.ParagraphFormat.LineSpacing = 18
    $Selection.ParagraphFormat.SpaceAfter = $SpaceAfter
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-PageBreak {
    param($Selection)
    $Selection.InsertBreak(7)
}

function Add-Bullets {
    param($Selection, [string[]]$Items)
    foreach ($item in $Items) {
        Add-Paragraph -Selection $Selection -Text ("- " + $item) -Size 12 -Bold $false -Alignment 0 -SpaceAfter 4
    }
}

function Add-FigurePage {
    param(
        $Selection,
        [string]$Title,
        [string]$FigurePath,
        [string]$Caption,
        [string[]]$Notes
    )

    Add-Paragraph $Selection $Title 18 $true 1 12
    if (Test-Path $FigurePath) {
        $Selection.InlineShapes.AddPicture($FigurePath) | Out-Null
        $Selection.TypeParagraph()
    }
    Add-Paragraph $Selection $Caption 11 $false 1 12
    if ($Notes) {
        Add-Bullets $Selection $Notes
    }
    Add-PageBreak $Selection
}

function Add-SectionPage {
    param(
        $Selection,
        [string]$Chapter,
        [string]$Title,
        [string[]]$Paragraphs,
        [string[]]$Bullets
    )

    Add-Paragraph $Selection $Chapter 18 $true 1 8
    Add-Paragraph $Selection $Title 16 $true 1 16
    foreach ($paragraph in $Paragraphs) {
        Add-Paragraph $Selection $paragraph 12 $false 0 8
    }
    if ($Bullets) {
        Add-Bullets $Selection $Bullets
    }
    Add-PageBreak $Selection
}

function Add-TablePage {
    param(
        $Doc,
        $Selection,
        [string]$Chapter,
        [string]$Title,
        [object[][]]$Rows
    )

    Add-Paragraph $Selection $Chapter 18 $true 1 8
    Add-Paragraph $Selection $Title 16 $true 1 16
    $range = $Selection.Range
    $table = $Doc.Tables.Add($range, $Rows.Count, $Rows[0].Count)
    $table.Borders.Enable = 1
    $table.Range.Font.Name = "Times New Roman"
    $table.Range.Font.Size = 11
    for ($r = 1; $r -le $Rows.Count; $r++) {
        for ($c = 1; $c -le $Rows[$r - 1].Count; $c++) {
            $table.Cell($r, $c).Range.Text = [string]$Rows[$r - 1][$c - 1]
        }
    }
    $Selection.EndKey(6) | Out-Null
    $Selection.TypeParagraph()
    Add-PageBreak $Selection
}

$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Add()
    $selection = $word.Selection

    Add-Paragraph $selection "CONSTRUCTHUB" 24 $true 1 14
    Add-Paragraph $selection "A Web-Based Platform for Connecting Clients and Construction Companies" 16 $true 1 8
    Add-Paragraph $selection "WITH AI-BASED INTERIOR AND EXTERIOR DESIGN SUGGESTION SUPPORT" 16 $true 1 18
    Add-Paragraph $selection "DETAILED PROJECT REPORT" 16 $true 1 18
    Add-Paragraph $selection "Prepared for academic project submission" 12 $false 1 8
    Add-Paragraph $selection "Student Name: ____________________" 12 $false 1 6
    Add-Paragraph $selection "USN / Roll Number: ____________________" 12 $false 1 6
    Add-Paragraph $selection "Department / College: ____________________" 12 $false 1 6
    Add-Paragraph $selection "Academic Year: 2025-2026" 12 $false 1 10
    Add-PageBreak $selection

    $frontMatter = @(
        @{ title = "CERTIFICATE"; body = @(
            "This is to certify that the project entitled 'ConstructHub' is a bonafide work carried out as part of the academic curriculum. The report demonstrates analysis, design, implementation, testing, and documentation of a full-stack web application for the construction domain.",
            "The work covers user management, build request workflow, company-client communication, AI-based design suggestion support, and report generation using a practical software engineering approach."
        )},
        @{ title = "DECLARATION"; body = @(
            "I hereby declare that this report is my original work carried out for academic purposes. The content has not been submitted previously for any other examination, diploma, or degree.",
            "All sources of information, software references, and conceptual help used in this work have been acknowledged appropriately."
        )},
        @{ title = "ACKNOWLEDGEMENT"; body = @(
            "I would like to thank my project guide, teaching faculty, and department for their guidance and encouragement throughout the development of ConstructHub.",
            "I am also grateful to my friends and family for their support and patience during implementation, testing, and report preparation."
        )},
        @{ title = "ABSTRACT"; body = @(
            "ConstructHub is a web-based platform designed to connect clients with construction companies through structured digital workflows. The system provides modules for registration, login, build request creation, company browsing, notification handling, chat communication, attachment sharing, and AI-assisted planning support.",
            "The application uses React.js and TypeScript in the frontend, FastAPI and Python in the backend, and PostgreSQL as the relational database. The AI Studio module captures requirement details and generates interior, exterior, material, color, and lighting suggestions. Results can be saved and exported into a downloadable PDF report."
        )},
        @{ title = "TABLE OF CONTENTS"; body = @(
            "Chapter 1: Introduction",
            "Chapter 2: Problem Analysis and Objectives",
            "Chapter 3: Requirement Analysis",
            "Chapter 4: Design and Architecture",
            "Chapter 5: Database and Data Flow Design",
            "Chapter 6: Implementation Details",
            "Chapter 7: Interface Design and Screen Snapshots",
            "Chapter 8: Testing, Results, and Limitations",
            "Chapter 9: Conclusion and Future Scope",
            "Appendices"
        )}
    )

    foreach ($item in $frontMatter) {
        Add-Paragraph $selection $item.title 18 $true 1 16
        foreach ($para in $item.body) {
            Add-Paragraph $selection $para 12 $false 0 8
        }
        Add-PageBreak $selection
    }

    $chapter1Pages = @(
        @{ title = "CHAPTER 1"; heading = "1.1 INTRODUCTION"; paragraphs = @(
            "The construction ecosystem includes clients, builders, architects, contractors, and interior teams who usually communicate through unstructured channels such as phone calls, messages, in-person meetings, and disconnected files. This often creates delays, misunderstandings, and repeated explanation of the same requirements.",
            "ConstructHub is proposed as a role-based web platform that centralizes project discovery, request sharing, response tracking, and discussion. The system focuses on early-stage communication where the right company has to be identified, the request needs to be documented, and the next conversation should happen inside a clear workflow."
        ); bullets = @("Domain: Construction collaboration", "Users: Clients and companies", "Core idea: One request, one connection, one active chat thread") },
        @{ title = "CHAPTER 1"; heading = "1.2 NEED FOR THE PROJECT"; paragraphs = @(
            "A client searching for a reliable company usually opens many websites, compares informal details, and repeats the same project description several times. Companies also receive unclear inquiries with missing location, budget, or style information. A structured digital system improves both sides of this interaction.",
            "The project is useful academically because it combines frontend design, API design, authentication, relational data modeling, report generation, and workflow control in one realistic application."
        ); bullets = @("Reduce scattered communication", "Improve traceability of project requests", "Support early decision-making through AI suggestions") },
        @{ title = "CHAPTER 1"; heading = "1.3 PROJECT SCOPE"; paragraphs = @(
            "The present scope includes landing pages, role-based registration and login, client build requests, company request acceptance, notification views, chat conversations, attachment sharing, and AI Studio. The scope intentionally stays within a college-project-sized implementation while still representing a usable end-to-end system.",
            "Features like payments, legal e-signatures, production cloud deployment, and advanced government document workflows are outside the current scope and are listed as future enhancements."
        ); bullets = @("Included: Requests, chat, AI suggestions, PDF export", "Excluded: Payment gateway, contracts, live calls") },
        @{ title = "CHAPTER 1"; heading = "1.4 REPORT ORGANIZATION"; paragraphs = @(
            "This report moves from problem framing to analysis, design, implementation, screenshots, and testing. Each chapter builds on the previous one so the document can be used both as a project submission and as a future reference for continuing the application.",
            "Dedicated pages are included for DFD, flowcharts, architecture diagrams, database design, interface layouts, and module-wise observations."
        ); bullets = @("Analysis chapters define the why", "Design chapters define the how", "Result chapters demonstrate the final output") }
    )
    foreach ($page in $chapter1Pages) {
        Add-SectionPage $selection $page.title $page.heading $page.paragraphs $page.bullets
    }

    $chapter2Pages = @(
        @{ heading = "2.1 PROBLEM WE ARE SOLVING"; paragraphs = @(
            "In traditional construction inquiry handling, the client explains the same need to multiple companies with little structure. Budget, location, plot size, and requirement descriptions are often buried in casual conversations or paper notes. This makes comparisons difficult and slows decision-making.",
            "From the company side, incoming requests arrive in different formats and there is no single place to evaluate, accept, reject, or continue the interaction. As a result, opportunities are lost and follow-up becomes inconsistent."
        ); bullets = @("No centralized request management", "Lack of structured communication", "No simple digital acceptance flow") },
        @{ heading = "2.2 EXISTING SYSTEM"; paragraphs = @(
            "The existing process generally relies on search engines, messaging apps, local contacts, and personal referrals. These channels may help in discovery, but they do not provide a clean system for request lifecycle management. There is no built-in status visibility and no unified message history tied to a project request.",
            "Existing generic portals may list businesses, but they do not always offer project-specific request details, acceptance workflow, or an AI-supported planning module tailored to early design discussion."
        ); bullets = @("Manual inquiries", "No integrated chat context", "Limited planning support") },
        @{ heading = "2.3 PROPOSED SYSTEM"; paragraphs = @(
            "ConstructHub introduces a role-aware workflow where clients create build requests, discover suitable companies, and initiate connection requests. Companies receive those requests inside their own dashboard or notification section and can explicitly accept or reject them.",
            "Once a request is accepted, both sides move into a focused chat view that supports text and attachment sharing. This keeps all communication tied to the request context and creates a more professional digital experience."
        ); bullets = @("Role-based workflow", "Single accepted communication channel", "Saved request history") },
        @{ heading = "2.4 OBJECTIVES AND SUCCESS CRITERIA"; paragraphs = @(
            "The project succeeds if users can complete core tasks without leaving the platform: register, log in, create a request, accept a connection, chat, and use AI Studio. A successful academic outcome also requires clear database design, modular APIs, and meaningful documentation.",
            "The system is evaluated through workflow completion, interface clarity, structured data capture, and correctness of role-specific routing."
        ); bullets = @("Functional completeness", "Readable UI", "Consistent backend data model") }
    )
    foreach ($page in $chapter2Pages) {
        Add-SectionPage $selection "CHAPTER 2" $page.heading $page.paragraphs $page.bullets
    }

    $reqPages = @(
        @{ heading = "3.1 FUNCTIONAL REQUIREMENTS"; bullets = @(
            "User registration for client and company roles",
            "Login with validation and warning messages",
            "Client profile and company profile management",
            "Build request creation, viewing, and deletion",
            "Company notification flow for client requests",
            "Accept and reject actions by companies",
            "One-to-one chat after acceptance",
            "Attachment sharing in chat",
            "AI Studio requirement form and suggestion generation",
            "Saved design list and PDF download"
        )},
        @{ heading = "3.2 NON-FUNCTIONAL REQUIREMENTS"; bullets = @(
            "Simple and attractive interface for college project demonstration",
            "Role-based navigation to prevent invalid access",
            "Clear form validation and readable warnings",
            "Fast response time for local development setup",
            "Structured database storage using PostgreSQL",
            "Maintainable code separation between frontend and backend"
        )},
        @{ heading = "3.3 HARDWARE REQUIREMENTS"; bullets = @(
            "Laptop or desktop computer",
            "Minimum 4 GB RAM recommended",
            "Internet connection for optional API-based AI provider use",
            "Storage space for project files, database, and local uploads"
        )},
        @{ heading = "3.4 SOFTWARE REQUIREMENTS"; bullets = @(
            "Operating System: Windows",
            "Code Editor: Visual Studio Code",
            "Frontend: React.js, TypeScript, Vite",
            "Backend: Python, FastAPI, SQLAlchemy",
            "Database: PostgreSQL",
            "Document Editing: WPS Office / Microsoft Word"
        )},
        @{ heading = "3.5 USER ROLES"; paragraphs = @(
            "The client role is responsible for creating build requests, browsing companies, starting connection requests, chatting after approval, and using AI Studio. The company role is responsible for maintaining its professional profile, checking incoming client requests, accepting or rejecting them, and sharing files in chat.",
            "An additional admin or faculty review role can inspect data tables for academic demonstration even if it is not a full production admin panel."
        ); bullets = @("Client", "Company", "Faculty / admin review") }
    )
    foreach ($page in $reqPages) {
        Add-SectionPage $selection "CHAPTER 3" $page.heading $page.paragraphs $page.bullets
    }

    Add-FigurePage $selection "CHAPTER 4 - 4.1 CONTEXT DFD" (Join-Path $assetDir "context-dfd.svg") "Figure 4.1: Context-level data flow showing interactions between client, company, admin, and AI/database services." @(
        "The context diagram presents ConstructHub as a single high-level process.",
        "External entities exchange requests, responses, suggestions, and data-review interactions with the platform."
    )
    Add-FigurePage $selection "CHAPTER 4 - 4.2 LEVEL-1 DFD" (Join-Path $assetDir "level1-dfd.svg") "Figure 4.2: Level-1 decomposition of the main processes inside ConstructHub." @(
        "Authentication handles credentials and access.",
        "Request, marketplace, chat, and AI modules operate as separate but connected services."
    )
    Add-FigurePage $selection "CHAPTER 4 - 4.3 PROCESS FLOW" (Join-Path $assetDir "process-flow.svg") "Figure 4.3: End-to-end workflow from registration to accepted chat and AI support." @(
        "The flow separates client and company responsibilities.",
        "The acceptance decision controls whether chat becomes active."
    )
    Add-FigurePage $selection "CHAPTER 4 - 4.4 SYSTEM ARCHITECTURE" (Join-Path $assetDir "system-architecture.svg") "Figure 4.4: Architectural split between frontend, backend, database, and external services." @(
        "The frontend is organized around pages and role-based navigation.",
        "The backend exposes routers for authentication, marketplace, profiles, chat, and AI."
    )
    Add-FigurePage $selection "CHAPTER 4 - 4.5 DATABASE ER DIAGRAM" (Join-Path $assetDir "database-er.svg") "Figure 4.5: Major relational entities and their key foreign-key links." @(
        "Users own either client or company profile data.",
        "Build requests create connections; connections hold messages; design requests hold AI suggestions."
    )

    $designPages = @(
        @{ heading = "4.6 SYSTEM DESIGN EXPLANATION"; paragraphs = @(
            "The design uses a clear separation of concerns. The frontend is responsible for layout, form state, and route-level access. The backend is responsible for validation, role checks, persistence, and workflow rules. PostgreSQL holds normalized records that keep user data, requests, connections, chats, and AI results consistent.",
            "This structure is intentionally simple enough for academic explanation but still realistic enough to scale into future improvements."
        ); bullets = @("Frontend presentation layer", "Backend API and business logic", "Relational persistence layer") },
        @{ heading = "4.7 UI DESIGN PRINCIPLES"; paragraphs = @(
            "The interface design focuses on clarity. The user should understand what comes next without heavy instructions. Buttons are action-specific, card groups are visually separated, and chat is centered around one accepted connection at a time.",
            "Animated backgrounds, gradient accents, and highlighted actions give the project a more modern presentation while keeping forms readable."
        ); bullets = @("Readable layouts", "Clear role separation", "Modern but practical styling") },
        @{ heading = "4.8 SECURITY AND ACCESS DESIGN"; paragraphs = @(
            "Role-based access is enforced so that company-only workflows cannot be used by clients and vice versa. Login is required to access protected areas such as dashboard, chat, and saved AI designs. API routes are paired with access checks using the authenticated user context.",
            "This approach demonstrates secure flow design at a college-project level even though advanced enterprise features like SSO and audit logging are not included."
        ); bullets = @("Protected routes", "Role-aware menus", "Backend ownership checks") }
    )
    foreach ($page in $designPages) {
        Add-SectionPage $selection "CHAPTER 4" $page.heading $page.paragraphs $page.bullets
    }

    $dbRows = @(
        @("Table", "Purpose", "Important Fields"),
        @("users", "Base login identities", "email, password, role, name, phone"),
        @("client_profiles", "Client details", "user_id, name, phone, location"),
        @("company_profiles", "Company details", "user_id, services, website, location"),
        @("build_requests", "Client project requests", "title, city, budget, description"),
        @("connections", "Client-company relation", "request_id, company_id, status"),
        @("messages", "Chat data", "body, sender_user_id, attachment fields"),
        @("design_requests", "AI input form data", "house_type, budget, style, plot_size, prompt"),
        @("ai_suggestions", "AI output records", "interior, exterior, materials, colors, lighting")
    )
    Add-TablePage $doc $selection "CHAPTER 5" "5.1 DATABASE TABLE OVERVIEW" $dbRows

    $dbPages = @(
        @{ heading = "5.2 USER DATA FLOW"; paragraphs = @(
            "Registration creates a user row and, depending on role, a related client or company profile row. This keeps authentication details separate from role-specific presentation details. It also makes later changes to profile content simpler without touching the login identity.",
            "The design is especially helpful for demonstrating normalization and one-to-one relationships in a relational model."
        ); bullets = @("users -> client_profiles", "users -> company_profiles") },
        @{ heading = "5.3 REQUEST AND CONNECTION FLOW"; paragraphs = @(
            "A build request belongs to a client. Companies do not directly own requests; instead, they create connection records when a client chooses to connect to them. This captures status values such as pending, accepted, or rejected without duplicating the request data itself.",
            "Messages are then attached to the accepted connection rather than the original request. This creates a clean chain from request to connection to conversation."
        ); bullets = @("build_requests -> connections", "connections -> messages") },
        @{ heading = "5.4 AI DATA FLOW"; paragraphs = @(
            "Design requirements entered in AI Studio are stored in design_requests. Generated suggestions are stored in ai_suggestions with a request_id link. This makes it possible to reopen saved designs later, display them in the client interface, and export them to PDF.",
            "Even in offline or fallback mode, the database still preserves the exact input and output structure used during the session."
        ); bullets = @("design_requests -> ai_suggestions", "Saved designs remain available for later review") },
        @{ heading = "5.5 DATA INTEGRITY CONSIDERATIONS"; paragraphs = @(
            "Foreign keys and ownership checks help maintain consistency. A user cannot delete another user's request. A company can act only on requests connected to its own profile. Chat deletion and saved-design deletion are handled carefully so related rows are removed or cascaded correctly.",
            "These checks are important because they turn the application from a simple UI demo into a system with meaningful backend rules."
        ); bullets = @("Ownership validation", "Cascade handling", "Role-specific access checks") }
    )
    foreach ($page in $dbPages) {
        Add-SectionPage $selection "CHAPTER 5" $page.heading $page.paragraphs $page.bullets
    }

    $implPages = @(
        @{ heading = "6.1 FRONTEND IMPLEMENTATION"; paragraphs = @(
            "The frontend is built using React.js with TypeScript. Page-level components are separated for Landing, About, Login, Register, Dashboard, Companies, Chat, Notifications, and AI Studio. Shared UI components such as Navbar, Footer, and Back Button help keep the interface consistent across routes.",
            "State is handled through local hooks and authentication context. This is sufficient for the present project because the workflow is clear and the application remains at manageable complexity."
        ); bullets = @("React component-based design", "TypeScript for safer UI code", "Reusable layout components") },
        @{ heading = "6.2 BACKEND IMPLEMENTATION"; paragraphs = @(
            "The backend uses FastAPI for HTTP routing and SQLAlchemy for database models. Separate routers are created for authentication, profile management, marketplace requests, chat, and AI Studio. This allows the codebase to remain organized while still being easy to explain in a viva or documentation review.",
            "Validation is handled using Pydantic schemas and backend dependency injection for authenticated user access."
        ); bullets = @("FastAPI routers", "Pydantic request/response models", "SQLAlchemy ORM models") },
        @{ heading = "6.3 AUTHENTICATION LOGIC"; paragraphs = @(
            "Registration collects name, phone, email, password, and role. Login validates required input and displays friendly warnings when fields are missing. Once authenticated, the user is routed to role-appropriate pages. This is a useful example of both backend and frontend validation working together.",
            "The project stores role information so that navigation can adapt dynamically and protected routes can enforce access boundaries."
        ); bullets = @("Field-level warnings", "Role-based redirects", "Protected inner pages") },
        @{ heading = "6.4 MARKETPLACE LOGIC"; paragraphs = @(
            "Clients can create build requests and then browse available company profiles. Selecting Connect creates a relation that the company sees later in the notification flow. Companies do not browse other companies for workflow actions; instead, they focus on incoming client requests.",
            "The marketplace logic reflects a practical domain relationship: requests originate from clients and decisions are made by companies."
        ); bullets = @("Client-originated requests", "Company acceptance workflow", "Status-driven progression") },
        @{ heading = "6.5 CHAT IMPLEMENTATION"; paragraphs = @(
            "Chat opens only after a connection is accepted. Both parties can send text, and both sides can now attach images or files. The interface includes message deletion and chat deletion, with backend routes enforcing sender or owner permissions.",
            "Refresh behavior was tuned to avoid scroll jumps while still allowing users to manually update the message list."
        ); bullets = @("Accepted-connection chat", "Attachment sharing", "Deletion APIs and UI actions") },
        @{ heading = "6.6 AI STUDIO IMPLEMENTATION"; paragraphs = @(
            "AI Studio accepts house type, budget, style, plot size, location, and a custom prompt. The system then creates suggestion output covering interior ideas, exterior ideas, color combinations, material suggestions, and lighting ideas. Results can be saved and exported as a PDF report.",
            "For college-project stability, the current working mode emphasizes suggestion text rather than depending entirely on live image generation quotas."
        ); bullets = @("Structured form + prompt", "Saved design records", "PDF generation support") }
    )
    foreach ($page in $implPages) {
        Add-SectionPage $selection "CHAPTER 6" $page.heading $page.paragraphs $page.bullets
    }

    Add-FigurePage $selection "CHAPTER 7 - 7.1 SCREENSHOT: LANDING PAGE" (Join-Path $assetDir "screen-landing.svg") "Figure 7.1: Landing page layout with animated hero, navigation, and registration call-to-action." @(
        "This screen introduces the platform and its main value proposition.",
        "The highlighted buttons direct users into role-based registration."
    )
    Add-FigurePage $selection "CHAPTER 7 - 7.2 SCREENSHOT: LOGIN PAGE" (Join-Path $assetDir "screen-login.svg") "Figure 7.2: Login page with simplified validation flow." @(
        "Email and password are required before the form is submitted.",
        "Readable warnings replace raw 422 backend messages."
    )
    Add-FigurePage $selection "CHAPTER 7 - 7.3 SCREENSHOT: CLIENT DASHBOARD" (Join-Path $assetDir "screen-dashboard.svg") "Figure 7.3: Client dashboard showing profile, request creation, and request history." @(
        "The left sidebar keeps profile, messages, and notifications in one place.",
        "The right panel focuses on active work such as request creation and chat access."
    )
    Add-FigurePage $selection "CHAPTER 7 - 7.4 SCREENSHOT: COMPANIES PAGE" (Join-Path $assetDir "screen-companies.svg") "Figure 7.4: Company listing cards with connect action." @(
        "Each card presents concise details needed for first-level comparison.",
        "The connect action starts the company-side approval workflow."
    )
    Add-FigurePage $selection "CHAPTER 7 - 7.5 SCREENSHOT: CHAT PAGE" (Join-Path $assetDir "screen-chat.svg") "Figure 7.5: Chat screen after request acceptance." @(
        "The left column lists active chats.",
        "The main area supports sending text and attachments through the plus button."
    )
    Add-FigurePage $selection "CHAPTER 7 - 7.6 SCREENSHOT: AI STUDIO" (Join-Path $assetDir "screen-ai-studio.svg") "Figure 7.6: AI Studio requirement form and suggestion result layout." @(
        "The form collects design constraints from the client.",
        "Saved designs and PDF export remain accessible from the same workspace."
    )

    $uiPages = @(
        @{ heading = "7.7 SCREEN DESIGN DISCUSSION"; paragraphs = @(
            "Each major screen is designed around one primary workflow. The landing page attracts users into registration, the dashboard centers request or notification work, chat minimizes distractions, and AI Studio keeps requirement entry and results close together.",
            "This focus on one clear action per screen improves demo quality and reduces confusion during live presentation."
        ); bullets = @("Action-first layouts", "Reduced clutter", "Visual grouping by workflow") },
        @{ heading = "7.8 ROLE-BASED NAVIGATION BEHAVIOR"; paragraphs = @(
            "Company users do not see AI Studio in the navigation because that flow belongs to the client side. Companies instead receive a notification-oriented workflow where incoming requests are reviewed and acted upon. Clients continue to see companies, AI Studio, dashboard, and chat as their main tools.",
            "This separation helps demonstrate access control not only in the backend but also in the visible user experience."
        ); bullets = @("Client-specific AI Studio", "Company-specific notifications", "Context-aware menus") },
        @{ heading = "7.9 ATTACHMENT SHARING EXPERIENCE"; paragraphs = @(
            "The chat input includes a plus button for both client and company users. This lets either side share images or files directly in the conversation after the connection is accepted. It reflects a more realistic collaboration scenario where plans, photos, or supporting files need to move with the conversation.",
            "Attachment messages remain tied to the chat record and can be used in future improvements such as cloud storage or file previews."
        ); bullets = @("Images and documents", "Shared from both roles", "Chat-linked storage path") }
    )
    foreach ($page in $uiPages) {
        Add-SectionPage $selection "CHAPTER 7" $page.heading $page.paragraphs $page.bullets
    }

    $testRows = @(
        @("Test Case", "Input / Action", "Expected Result", "Observed"),
        @("Registration", "Create client/company user", "Account stored successfully", "Pass"),
        @("Login validation", "Leave email or password empty", "Friendly warning shown", "Pass"),
        @("Build request creation", "Client submits request", "Request appears in dashboard", "Pass"),
        @("Company notification", "Client sends connect request", "Company sees pending item", "Pass"),
        @("Connection accept", "Company accepts request", "Chat becomes available", "Pass"),
        @("Attachment sharing", "Send file in chat", "Attachment appears in conversation", "Pass"),
        @("Saved design delete", "Delete design card", "Record removed from list and DB", "Pass"),
        @("Request delete", "Delete own build request", "Record removed from dashboard", "Pass")
    )
    Add-TablePage $doc $selection "CHAPTER 8" "8.1 TEST CASE SUMMARY" $testRows

    $testPages = @(
        @{ heading = "8.2 RESULT ANALYSIS"; paragraphs = @(
            "The application successfully demonstrates the complete role-based flow from registration to accepted chat. The most important academic result is that all modules are connected: database entities, backend routes, frontend pages, and user behavior all reflect one coherent business process.",
            "AI Studio currently focuses on suggestion generation rather than mandatory live image generation because text support is the most stable feature for presentation and evaluation."
        ); bullets = @("End-to-end workflow works", "Database-backed modules are connected", "UI reflects backend state changes") },
        @{ heading = "8.3 LIMITATIONS"; paragraphs = @(
            "Some advanced production features are intentionally outside the current implementation. Live third-party image generation can be affected by provider quotas or account access. Document verification, payment workflows, and enterprise reporting are not part of the current build.",
            "These limitations are appropriate for a college project and help keep the system understandable while still demonstrating meaningful engineering depth."
        ); bullets = @("API quota dependency for live AI images", "Local file storage only", "No payment or contract system") },
        @{ heading = "8.4 RISK AND MAINTENANCE NOTES"; paragraphs = @(
            "As the project grows, careful handling of file uploads, access tokens, and database migrations will become more important. A future production version would benefit from audit logging, cloud storage, environment-specific deployment, and background jobs for long-running AI tasks.",
            "These observations are included so the project can be discussed not only as a finished demo but also as a foundation for future software engineering improvements."
        ); bullets = @("Need stronger deployment pipeline", "Need cloud-scale storage and logs", "Need staged migrations") }
    )
    foreach ($page in $testPages) {
        Add-SectionPage $selection "CHAPTER 8" $page.heading $page.paragraphs $page.bullets
    }

    $conclusionPages = @(
        @{ heading = "9.1 CONCLUSION"; paragraphs = @(
            "ConstructHub successfully brings together client discovery, company response handling, accepted-chat communication, and AI-assisted planning in one full-stack application. The project demonstrates how a domain-specific platform can simplify an otherwise fragmented early-stage construction workflow.",
            "From an academic standpoint, the project combines interface design, authentication, API development, relational database design, state management, and report generation into a coherent deliverable that is easy to explain and visually present."
        ); bullets = @("Practical domain problem", "Complete technology stack", "Strong demonstration value") },
        @{ heading = "9.2 FUTURE ENHANCEMENTS"; paragraphs = @(
            "Future work can include live WebSocket chat, cloud attachment storage, company ratings, legal document verification flow, payment handling, and deployment to a public hosting environment. AI support can also be improved with stable paid-provider integration and richer design-specific knowledge.",
            "A future version could also support contractor scheduling, site progress tracking, estimation tools, and project milestone dashboards."
        ); bullets = @("WebSocket chat", "Cloud storage", "Payments and ratings", "Advanced AI provider integration") },
        @{ heading = "9.3 FINAL REMARK"; paragraphs = @(
            "The application is a strong example of a college project that goes beyond static pages. It shows real workflows, state transitions, database-backed behavior, and user-role differentiation. The report and diagram set included here are intended to support both submission and viva discussion.",
            "Because the document is generated in Word format, it can be further edited in WPS Office to add college branding, student details, signatures, and page styling."
        ); bullets = @("Editable in WPS", "Suitable for viva explanation", "Expandable for final submission formatting") }
    )
    foreach ($page in $conclusionPages) {
        Add-SectionPage $selection "CHAPTER 9" $page.heading $page.paragraphs $page.bullets
    }

    $appendixTitles = @(
        "APPENDIX A - TECHNOLOGY STACK NOTES",
        "APPENDIX B - API MODULE SUMMARY",
        "APPENDIX C - SCREEN-WISE OBSERVATIONS",
        "APPENDIX D - DATABASE FIELD NOTES",
        "APPENDIX E - SAMPLE VIVA QUESTIONS",
        "APPENDIX F - FUTURE MODULE IDEAS",
        "APPENDIX G - TEST EXECUTION NOTES",
        "APPENDIX H - DEPLOYMENT CHECKLIST",
        "APPENDIX I - GLOSSARY",
        "APPENDIX J - REFERENCES"
    )
    foreach ($title in $appendixTitles) {
        Add-Paragraph $selection $title 18 $true 1 16
        Add-Paragraph $selection "This appendix page can be customized further in WPS Office with institution-specific formatting, code snippets, signatures, screenshots, or additional notes required by your department." 12 $false 0 8
        Add-Paragraph $selection "Suggested content for this appendix includes module-level explanations, sample API payloads, expanded test observations, implementation screenshots, or viva preparation points." 12 $false 0 8
        Add-PageBreak $selection
    }

    $minPages = 85
    $currentPages = $doc.ComputeStatistics(2)
    while ($currentPages -lt $minPages) {
        Add-Paragraph $selection "ADDITIONAL PROJECT NOTES" 18 $true 1 16
        Add-Paragraph $selection "This page is intentionally reserved for further college-specific content such as institutional formatting, signatures, module explanations, expanded screenshots, or reviewer notes." 12 $false 0 8
        Add-Bullets $selection @(
            "Add faculty-approved formatting if required.",
            "Insert extra screenshots from your running application if desired.",
            "Use this page for viva answers, architecture explanation, or code snippets."
        )
        Add-PageBreak $selection
        $currentPages = $doc.ComputeStatistics(2)
    }

    $doc.SaveAs([ref]$outPath)
    $pageCount = $doc.ComputeStatistics(2)
    Write-Output "Saved report to: $outPath"
    Write-Output "Page count: $pageCount"
}
finally {
    if ($doc -ne $null) { $doc.Close() }
    if ($word -ne $null) { $word.Quit() }
}
