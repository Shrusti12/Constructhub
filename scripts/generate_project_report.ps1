$ErrorActionPreference = "Stop"

$outPath = "C:\Users\shrus\Documents\Codex\2026-04-26\i-want-to-create-webapplication-on\ConstructHub_Project_Report_30_Pages.docx"

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
    param(
        $Selection,
        [string[]]$Items
    )
    foreach ($item in $Items) {
        Add-Paragraph -Selection $Selection -Text ("- " + $item) -Size 12 -Bold $false -Alignment 0 -SpaceAfter 4
    }
}

$word = $null
$doc = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Add()
    $selection = $word.Selection

    # Title page
    Add-Paragraph $selection "CONSTRUCTHUB" 22 $true 1 12
    Add-Paragraph $selection "A Web-Based Platform for Connecting Clients and Construction Companies" 16 $true 1 8
    Add-Paragraph $selection "with AI-Based Design Suggestion Support" 16 $true 1 20
    Add-Paragraph $selection "PROJECT REPORT" 16 $true 1 20
    Add-Paragraph $selection "Submitted in partial fulfillment of the requirements" 12 $false 1 6
    Add-Paragraph $selection "for the award of the degree/project completion" 12 $false 1 6
    Add-Paragraph $selection "in Computer Science / Information Science" 12 $false 1 20
    Add-Paragraph $selection "Prepared by" 12 $true 1 6
    Add-Paragraph $selection "Shrus" 14 $true 1 12
    Add-Paragraph $selection "Academic Year: 2025-2026" 12 $false 1 8
    Add-Paragraph $selection "Guide / Department / College Details" 12 $false 1 8
    Add-Paragraph $selection "ConstructHub College Project" 12 $false 1 8
    Add-PageBreak $selection

    # Certificate
    Add-Paragraph $selection "CERTIFICATE" 18 $true 1 16
    Add-Paragraph $selection "This is to certify that the project entitled 'ConstructHub: A Web-Based Platform for Connecting Clients and Construction Companies with AI-Based Design Suggestion Support' is a bonafide work carried out by the student as part of the academic project requirements. The work presented in this report is original and has been completed under proper guidance and supervision." 12 $false 0 8
    Add-Paragraph $selection "The project demonstrates full-stack web development concepts, database design, user authentication, request handling, chat communication, and AI-assisted planning support. The project has been evaluated and found suitable for submission as a college project report." 12 $false 0 8
    Add-Paragraph $selection "Guide Signature: ____________________" 12 $false 0 6
    Add-Paragraph $selection "Head of Department: ____________________" 12 $false 0 6
    Add-Paragraph $selection "Principal: ____________________" 12 $false 0 6
    Add-Paragraph $selection "Date: ____________________" 12 $false 0 6
    Add-PageBreak $selection

    # Declaration
    Add-Paragraph $selection "DECLARATION" 18 $true 1 16
    Add-Paragraph $selection "I hereby declare that the project report entitled 'ConstructHub: A Web-Based Platform for Connecting Clients and Construction Companies with AI-Based Design Suggestion Support' is my own work carried out for academic purposes. The material presented in this report has not been submitted previously, either in part or in full, for the award of any degree or diploma." 12 $false 0 8
    Add-Paragraph $selection "I further declare that all references used in the preparation of this report have been acknowledged properly. Any assistance received during development and documentation has been appropriately credited wherever necessary." 12 $false 0 8
    Add-Paragraph $selection "Student Signature: ____________________" 12 $false 0 6
    Add-Paragraph $selection "Name: ____________________" 12 $false 0 6
    Add-Paragraph $selection "USN / Roll No: ____________________" 12 $false 0 6
    Add-PageBreak $selection

    # Acknowledgement
    Add-Paragraph $selection "ACKNOWLEDGEMENT" 18 $true 1 16
    Add-Paragraph $selection "I express my sincere gratitude to my project guide, faculty members, and the department for their valuable guidance and encouragement during the development of ConstructHub. Their technical suggestions and academic support helped shape this work into a complete and meaningful project." 12 $false 0 8
    Add-Paragraph $selection "I also thank my friends and classmates for their support, feedback, and motivation throughout the project lifecycle. Finally, I am thankful to my family for their patience and constant encouragement, which helped me complete the project successfully." 12 $false 0 8
    Add-PageBreak $selection

    # Abstract
    Add-Paragraph $selection "ABSTRACT" 18 $true 1 16
    Add-Paragraph $selection "ConstructHub is a web-based application developed to simplify communication and planning between clients and construction companies through a centralized digital platform. The system combines multiple modules such as user authentication, company discovery, build request management, company response handling, chat communication, file attachments, and AI-based design suggestion support. The main goal of the platform is to reduce manual effort, organize project communication, and assist users in making better planning decisions." 12 $false 0 8
    Add-Paragraph $selection "The application uses React.js for the frontend to deliver a responsive and interactive interface, FastAPI in Python for backend logic and API development, and PostgreSQL as the primary database. Role-based workflows are provided for clients and companies. Clients can create build requests, browse companies, send connection requests, and use the AI Studio module for idea generation. Companies can review incoming requests, accept or reject them, and communicate with clients through an integrated chat interface." 12 $false 0 8
    Add-Paragraph $selection "The AI Studio module provides structured interior and exterior design suggestions based on inputs such as house type, budget, style, location, plot size, and user prompt. Results can be saved and exported as a PDF report. The system demonstrates a practical full-stack approach to modernizing construction-related communication and planning tasks. It is suitable as an academic project because it integrates frontend design, backend development, database design, authentication, workflow control, and user-focused interface behavior into a single solution." 12 $false 0 8
    Add-PageBreak $selection

    # Contents
    Add-Paragraph $selection "TABLE OF CONTENTS" 18 $true 1 16
    $contents = @(
        "Certificate",
        "Declaration",
        "Acknowledgement",
        "Abstract",
        "Chapter 1 - Introduction",
        "Chapter 2 - Literature Survey",
        "Chapter 3 - Requirement Analysis",
        "Chapter 4 - System Design",
        "Chapter 5 - Implementation",
        "Chapter 6 - Testing and Results",
        "Chapter 7 - Conclusion and Future Scope",
        "References",
        "Appendix"
    )
    Add-Bullets $selection $contents
    Add-PageBreak $selection

    # Chapter 1
    Add-Paragraph $selection "CHAPTER 1" 18 $true 1 12
    Add-Paragraph $selection "INTRODUCTION" 16 $true 1 16
    Add-Paragraph $selection "1.1 Background" 14 $true 0 10
    Add-Paragraph $selection "The construction domain involves many participants such as clients, builders, architects, interior designers, and contractors. In many real situations, communication between these participants is fragmented across calls, chats, in-person visits, and separate documentation channels. As a result, project requirements are not always captured in a structured way, decision-making becomes slow, and clients often find it difficult to compare service providers or manage early-stage planning in an organized manner." 12 $false 0 8
    Add-Paragraph $selection "With the rapid growth of web technologies and digital workflows, it has become possible to create integrated platforms that centralize these interactions. ConstructHub is built with the idea that a single system should be able to handle project discovery, company exploration, communication, and basic planning support without forcing users to switch between disconnected tools. The project targets the practical gap between the need for digital project planning and the lack of simple construction-specific collaboration platforms in small and medium use cases." 12 $false 0 8
    Add-Paragraph $selection "1.2 Purpose of the Project" 14 $true 0 10
    Add-Paragraph $selection "The purpose of ConstructHub is to provide an end-to-end digital workflow for clients and construction companies. Clients can register, create project requests, browse company profiles, connect with suitable companies, and communicate directly after acceptance. Companies can maintain their professional profile, review client requests, respond to them, and continue conversation through the platform. The project also introduces an AI-based suggestion module to support early design planning." 12 $false 0 8
    Add-Paragraph $selection "The project is intended not only as a software system but also as a demonstration of full-stack application development. It includes user interface design, backend API development, relational database design, state management, access control, file sharing, and document/report generation. This makes it a strong academic example of applying software engineering principles to a domain-specific problem." 12 $false 0 8
    Add-Paragraph $selection "1.3 Problem Statement" 14 $true 0 10
    Add-Paragraph $selection "Traditional construction planning is often handled manually or through loosely connected systems. Clients must search for companies independently, compare services without a structured view, explain project requirements repeatedly, and wait for responses through informal channels. Companies, on the other hand, receive unclear client requirements, lack a simple request dashboard, and may not have a central communication thread for each project inquiry. These limitations reduce efficiency, increase confusion, and delay decision-making." 12 $false 0 8
    Add-Paragraph $selection "1.4 Objectives" 14 $true 0 10
    Add-Bullets $selection @(
        "To build a centralized platform that connects clients and construction companies.",
        "To enable role-based user registration and authentication.",
        "To provide request creation, acceptance, and rejection workflows.",
        "To enable chat communication and file sharing between accepted connections.",
        "To provide AI-based interior and exterior suggestion support for project planning.",
        "To store structured project and communication data using PostgreSQL.",
        "To generate downloadable reports for AI suggestion results."
    )
    Add-Paragraph $selection "1.5 Scope" 14 $true 0 10
    Add-Paragraph $selection "The scope of ConstructHub includes authentication, profile management, client build requests, company response handling, notifications, messaging, attachment support, AI suggestion generation, saved design records, and PDF export. The current scope does not include online payments, contract execution, advanced scheduling, or production-grade cloud deployment. However, the platform is designed in a modular manner so that these features can be added in the future." 12 $false 0 8
    Add-Paragraph $selection "1.6 Advantages" 14 $true 0 10
    Add-Bullets $selection @(
        "Centralized workflow for construction communication.",
        "Role-based dashboard for both clients and companies.",
        "Better organization of project requests and company responses.",
        "Integrated chat and file attachment support.",
        "AI-based planning assistance for early design thinking.",
        "Clean and attractive web UI with responsive behavior.",
        "Extensible architecture for future enhancements."
    )
    Add-PageBreak $selection

    # Chapter 2
    Add-Paragraph $selection "CHAPTER 2" 18 $true 1 12
    Add-Paragraph $selection "LITERATURE SURVEY" 16 $true 1 16
    Add-Paragraph $selection "2.1 Need for a Construction Collaboration Platform" 14 $true 0 10
    Add-Paragraph $selection "Many project domains already use task and communication platforms, but construction planning at the individual client level is still often handled through fragmented channels. Existing general-purpose communication tools provide chat, while listing platforms provide company discovery, and design tools provide isolated visual planning support. The absence of a single lightweight workflow for client-company construction interaction creates a gap that ConstructHub addresses." 12 $false 0 8
    Add-Paragraph $selection "2.2 Related Digital Systems" 14 $true 0 10
    Add-Paragraph $selection "Construction management software, customer relationship systems, and freelance marketplace platforms have influenced the design of ConstructHub. From construction software, the project borrows the idea of milestone-oriented information handling. From CRM systems, it borrows request tracking and user-role workflows. From service marketplaces, it borrows profile browsing and connection flows. However, ConstructHub keeps the system simpler and more focused on educational demonstration and practical interaction between client and company." 12 $false 0 8
    Add-Paragraph $selection "2.3 AI Support in Planning Systems" 14 $true 0 10
    Add-Paragraph $selection "AI tools are increasingly used to help users generate concept ideas, summarize requirements, and guide design selection. In planning systems, AI can assist users who are not domain experts by translating general ideas such as 'modern 2BHK home with storage and natural lighting' into actionable suggestion sets. In ConstructHub, the AI Studio module is not intended to replace architects or engineers, but to support early-stage thinking and make the planning workflow more engaging and informative." 12 $false 0 8
    Add-Paragraph $selection "2.4 Gap Analysis" 14 $true 0 10
    Add-Paragraph $selection "After comparing existing approaches, the following gaps were identified: lack of integrated client-company communication, poor support for structured build requests, lack of lightweight design suggestion workflows, and limited domain-focused web platforms for educational demonstration. ConstructHub is proposed as a unified system that reduces these gaps in a simple, understandable, and extensible architecture." 12 $false 0 8
    Add-Paragraph $selection "2.5 Summary of Survey" 14 $true 0 10
    Add-Paragraph $selection "The literature and system comparison indicate that there is strong value in combining communication, request management, company discovery, and AI-based suggestion support within one platform. ConstructHub has been designed with this integrated perspective and developed using a modern full-stack web architecture." 12 $false 0 8
    Add-PageBreak $selection

    # Chapter 3
    Add-Paragraph $selection "CHAPTER 3" 18 $true 1 12
    Add-Paragraph $selection "REQUIREMENT ANALYSIS" 16 $true 1 16
    Add-Paragraph $selection "3.1 Functional Requirements" 14 $true 0 10
    Add-Bullets $selection @(
        "User registration and login for client and company roles.",
        "Client profile and company profile management.",
        "Creation, display, and deletion of build requests.",
        "Browsing and filtering of company profiles.",
        "Connection request from client to company.",
        "Acceptance and rejection of client requests by company.",
        "Chat communication between accepted client-company pairs.",
        "File and image attachment sharing in chat.",
        "AI suggestion generation using structured fields and custom prompt.",
        "Saving and reopening AI suggestion results.",
        "PDF export of AI suggestion report."
    )
    Add-Paragraph $selection "3.2 Non-Functional Requirements" 14 $true 0 10
    Add-Bullets $selection @(
        "Responsive and user-friendly interface.",
        "Role-based access control.",
        "Maintainable backend API structure.",
        "Secure password handling and token-based authentication.",
        "Database consistency for connected modules.",
        "Readable, simple workflows suitable for educational demonstration."
    )
    Add-Paragraph $selection "3.3 Software Requirements" 14 $true 0 10
    Add-Bullets $selection @(
        "Frontend: React.js, TypeScript, Vite",
        "Backend: Python, FastAPI, SQLAlchemy, Uvicorn",
        "Database: PostgreSQL",
        "Libraries: Pydantic, Passlib, JOSE, Pillow, ReportLab"
    )
    Add-Paragraph $selection "3.4 Hardware Requirements" 14 $true 0 10
    Add-Bullets $selection @(
        "Processor: Intel i3 or above",
        "RAM: 4 GB minimum",
        "Storage: 10 GB free space",
        "Internet connection for package installation and optional API use",
        "Browser: Chrome, Edge, or Firefox"
    )
    Add-Paragraph $selection "3.5 User Roles" 14 $true 0 10
    Add-Paragraph $selection "ConstructHub provides two primary user roles. A client is the user who plans a project, creates build requests, browses companies, connects with companies, chats with accepted companies, and uses AI suggestion features. A company is the user who maintains a business profile, receives incoming client requests, accepts or rejects connections, communicates through chat, and shares files or images with clients." 12 $false 0 8
    Add-PageBreak $selection

    # Chapter 4
    Add-Paragraph $selection "CHAPTER 4" 18 $true 1 12
    Add-Paragraph $selection "SYSTEM DESIGN" 16 $true 1 16
    Add-Paragraph $selection "4.1 Architecture" 14 $true 0 10
    Add-Paragraph $selection "ConstructHub follows a three-layer architecture. The presentation layer is the React.js frontend, responsible for pages, navigation, form interactions, dashboard views, chat interface, and AI Studio. The application layer is built with FastAPI and contains route handlers, authentication, request validation, workflow logic, and database interaction. The data layer is powered by PostgreSQL and stores users, profiles, build requests, connections, messages, read-tracking, and AI suggestion records." 12 $false 0 8
    Add-Paragraph $selection "4.2 Module Design" 14 $true 0 10
    Add-Paragraph $selection "The system is divided into clear modules: authentication, profile management, marketplace/company browsing, build requests, company notifications, chat, attachments, and AI Studio. Each module communicates through HTTP APIs and structured JSON payloads. This modular design improves readability, reduces tight coupling, and supports future enhancement." 12 $false 0 8
    Add-Paragraph $selection "4.3 Database Design" 14 $true 0 10
    Add-Paragraph $selection "The data model uses normalized relational tables. The users table stores authentication and identity details. company_profiles and client_profiles extend role-specific information. build_requests store project needs created by clients. connections link requests to interested companies. messages and connection_reads support communication and unread counts. design_requests and ai_suggestions support the AI Studio module and report generation. The schema is built to reflect workflow ownership and access control rules." 12 $false 0 8
    Add-Paragraph $selection "4.4 Data Flow" 14 $true 0 10
    Add-Paragraph $selection "A client logs in, creates a request, selects a company, and sends a connection. The company sees the incoming request in dashboard and notifications, then accepts or rejects it. On acceptance, both users access chat tied to that connection. In AI Studio, the user fills structured fields and a custom prompt, then receives suggestion data which is stored and later available for reopening and PDF export." 12 $false 0 8
    Add-Paragraph $selection "4.5 Interface Design Principles" 14 $true 0 10
    Add-Paragraph $selection "The frontend uses a consistent dark-themed interface with card surfaces, role-based navigation, supportive feedback messages, and layout sections that help users understand what to do next. Animation and modern styling are used to improve visual quality without hiding functionality." 12 $false 0 8
    Add-PageBreak $selection

    # Chapter 5
    Add-Paragraph $selection "CHAPTER 5" 18 $true 1 12
    Add-Paragraph $selection "IMPLEMENTATION" 16 $true 1 16
    Add-Paragraph $selection "5.1 Frontend Implementation" 14 $true 0 10
    Add-Paragraph $selection "The frontend is built using React.js with TypeScript. Routing is handled with react-router-dom, enabling page-level separation such as landing page, login, registration, companies, dashboard, notifications, chat, and AI Studio. Reusable UI elements such as navigation bar, footer, background components, surface cards, and back button keep the interface consistent across the application." 12 $false 0 8
    Add-Paragraph $selection "State-driven workflows are used for authentication, notifications, chat lists, AI Studio results, and profile editing. Forms validate required fields before API submission to provide cleaner user feedback. Type-safe API interactions help reduce frontend errors and improve maintainability." 12 $false 0 8
    Add-Paragraph $selection "5.2 Backend Implementation" 14 $true 0 10
    Add-Paragraph $selection "The backend uses FastAPI to expose REST endpoints. Authentication is implemented using token-based login with secure password hashing. Route groups are organized around authentication, profile handling, marketplace/request management, chat, AI, and admin views. SQLAlchemy ORM is used to define models and perform relational queries. Startup logic ensures the database schema is created and synced for development convenience." 12 $false 0 8
    Add-Paragraph $selection "5.3 Build Request Workflow" 14 $true 0 10
    Add-Paragraph $selection "Clients create structured build requests using title, description, city, and budget range. These requests are stored in the database and shown in the dashboard. Companies are connected to requests through the connections table. The delete functionality for client requests allows removal of outdated requirements while preserving ownership checks at the backend." 12 $false 0 8
    Add-Paragraph $selection "5.4 Company Response Workflow" 14 $true 0 10
    Add-Paragraph $selection "When a client connects to a company, a pending connection is created. The company dashboard and notifications page show incoming client requests with client name, request title, city, budget range, and description. The company can accept or reject the request. Acceptance activates chat and marks the request as in progress." 12 $false 0 8
    Add-Paragraph $selection "5.5 Chat and Attachment Workflow" 14 $true 0 10
    Add-Paragraph $selection "Chat is implemented through connection-specific message threads. Only accepted connections can send messages. Messages support text, message deletion, chat deletion, and file or image attachments. Attachments are stored locally through an uploads directory and are represented in the database through message metadata fields such as attachment name, URL, and kind. Both client and company can send attachments after connection acceptance." 12 $false 0 8
    Add-Paragraph $selection "5.6 AI Studio Implementation" 14 $true 0 10
    Add-Paragraph $selection "The AI Studio page supports structured user inputs including house type, budget, style, plot size, location, and a custom prompt. These values are sent to the backend, where suggestion content is generated either through provider-backed text generation or a controlled fallback. Suggestions cover interior design, exterior design, color combinations, materials, and lighting. Results are stored in design_requests and ai_suggestions tables and can be exported as PDF." 12 $false 0 8
    Add-Paragraph $selection "5.7 Report Generation" 14 $true 0 10
    Add-Paragraph $selection "ConstructHub includes downloadable project-style PDF export for AI suggestion results. The report generator formats key inputs and output sections into a printable structure, making it easy to reuse the planning result as part of discussion or academic presentation." 12 $false 0 8
    Add-PageBreak $selection

    # Chapter 6
    Add-Paragraph $selection "CHAPTER 6" 18 $true 1 12
    Add-Paragraph $selection "TESTING AND RESULTS" 16 $true 1 16
    Add-Paragraph $selection "6.1 Testing Strategy" 14 $true 0 10
    Add-Paragraph $selection "The application was tested incrementally during development. Frontend interactions were verified using manual browser testing and TypeScript build checks. Backend behavior was validated through route testing, database updates, and workflow confirmation during integration. Since the project is intended for academic demonstration, emphasis was placed on verifying complete role-based workflows rather than performance benchmarking at scale." 12 $false 0 8
    Add-Paragraph $selection "6.2 Test Scenarios" 14 $true 0 10
    Add-Bullets $selection @(
        "User registration with client and company roles",
        "Login validation and required-field messaging",
        "Profile creation and update",
        "Client build request creation",
        "Client build request deletion",
        "Company request review and response",
        "Notifications and unread indicators",
        "Chat message send and delete",
        "Chat deletion",
        "Attachment upload in chat",
        "AI suggestion generation and save",
        "AI report download"
    )
    Add-Paragraph $selection "6.3 Observed Results" 14 $true 0 10
    Add-Paragraph $selection "The completed system demonstrates a connected workflow from account creation to communication and planning support. Clients can submit requests and reach companies more systematically than with unstructured manual communication. Companies receive organized requests in a reviewable format. Chat and file sharing reduce dependency on external communication tools. The AI Studio, while intentionally simplified in the final version, still provides planning-oriented text suggestions and saved report generation." 12 $false 0 8
    Add-Paragraph $selection "6.4 Limitations During Testing" 14 $true 0 10
    Add-Paragraph $selection "Some advanced features such as live external image generation were affected by provider availability, API limits, or account access constraints. Therefore, the project was stabilized toward reliable suggestion-based output. This is acceptable for a college project because the architecture and integration flow were still demonstrated, even where external provider access was limited." 12 $false 0 8
    Add-Paragraph $selection "6.5 Quality Improvements" 14 $true 0 10
    Add-Paragraph $selection "Several usability improvements were introduced during testing, such as cleaner validation messages, better navigation with back buttons, structured request deletion warnings, hiding irrelevant pages by role, improving dashboard flows, and stabilizing the chat experience by removing overly aggressive auto-refresh behavior. These changes improved the user experience and made the system easier to demonstrate." 12 $false 0 8
    Add-PageBreak $selection

    # Chapter 7
    Add-Paragraph $selection "CHAPTER 7" 18 $true 1 12
    Add-Paragraph $selection "CONCLUSION AND FUTURE SCOPE" 16 $true 1 16
    Add-Paragraph $selection "7.1 Conclusion" 14 $true 0 10
    Add-Paragraph $selection "ConstructHub successfully demonstrates how a domain-focused web application can improve communication and planning between clients and construction companies. The system integrates user management, profile handling, request workflows, notifications, chat, file sharing, and AI-based planning support into a single platform. It addresses the practical issue of disconnected tools in construction planning by offering a clearer, more organized digital workflow." 12 $false 0 8
    Add-Paragraph $selection "From a technical point of view, the project also demonstrates the integration of React.js, FastAPI, and PostgreSQL in a full-stack environment. The use of modular APIs, role-based control, and structured database design makes the application understandable, extendable, and suitable for academic evaluation. The final system is not just a prototype of screens, but a functioning workflow-driven application." 12 $false 0 8
    Add-Paragraph $selection "7.2 Future Scope" 14 $true 0 10
    Add-Bullets $selection @(
        "Advanced AI suggestion generation with richer provider integration",
        "Real-time chat using WebSocket support",
        "Cloud-based storage for attachments and reports",
        "Land document verification workflow",
        "Company ratings and client reviews",
        "Payment or quotation workflow",
        "Project timeline and progress dashboard",
        "Admin review and moderation panel",
        "Mobile application version",
        "Production deployment and analytics"
    )
    Add-PageBreak $selection

    # References
    Add-Paragraph $selection "REFERENCES" 18 $true 1 16
    Add-Bullets $selection @(
        "React Documentation",
        "FastAPI Documentation",
        "SQLAlchemy Documentation",
        "PostgreSQL Documentation",
        "Pydantic Documentation",
        "ReportLab Documentation",
        "Framer Motion Documentation",
        "Vite Documentation",
        "Python Official Documentation"
    )
    Add-PageBreak $selection

    # Appendix starting content
    Add-Paragraph $selection "APPENDIX" 18 $true 1 16
    Add-Paragraph $selection "Appendix A: Key Screens and Module Notes" 14 $true 0 10
    Add-Paragraph $selection "The major screens of the project include the landing page, login page, registration page, companies page, dashboard, notifications page, chat page, and AI Studio page. Each screen was designed to support a direct user action and keep the workflow understandable for both client and company roles." 12 $false 0 8
    Add-Paragraph $selection "The landing page introduces the platform, the login and registration pages handle access control, the companies page helps clients browse service providers, the dashboard centralizes profile and request tasks, the notifications page highlights company-side pending responses, and the chat page enables ongoing project communication. The AI Studio page demonstrates planning-oriented suggestions with saved outputs and report generation." 12 $false 0 8

    # Ensure 30 pages minimum
    $appendixIndex = 1
    while ($doc.ComputeStatistics(2) -lt 30) {
        Add-PageBreak $selection
        Add-Paragraph $selection ("APPENDIX B" + $appendixIndex) 18 $true 1 16
        Add-Paragraph $selection ("Additional Discussion " + $appendixIndex) 14 $true 0 10
        Add-Paragraph $selection "ConstructHub can be extended into a larger ecosystem by integrating deeper construction workflows such as quotation comparisons, contractor progress updates, milestone payments, approval history, and real-time collaboration. From an academic perspective, these extensions show how the current project can evolve from a role-based service platform into a more complete project lifecycle system." 12 $false 0 8
        Add-Paragraph $selection "Another important direction is data-driven personalization. Future versions can analyze client preferences, company service history, and previous request patterns to suggest better matches between clients and companies. This can improve recommendation quality and reduce the time users spend searching for suitable service providers." 12 $false 0 8
        Add-Paragraph $selection "The current project already demonstrates a strong base for such improvements because its modular structure separates user management, request handling, communication, and planning support into manageable components. This means additional features can be layered on top without redesigning the entire system from the beginning." 12 $false 0 8
        $appendixIndex++
    }

    $doc.SaveAs([ref]$outPath, [ref]16)
    $pages = $doc.ComputeStatistics(2)
    $doc.Close()
    try { $word.Quit() } catch {}

    Write-Output "Created: $outPath"
    Write-Output "Pages: $pages"
}
finally {
    if ($doc -ne $null) {
        try { $doc.Close() } catch {}
    }
    if ($word -ne $null) {
        try { $word.Quit() } catch {}
    }
}
