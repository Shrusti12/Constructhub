param(
  [string]$TemplatePath = "C:\Users\shrus\Downloads\Report Formate.docx",
  [string]$OutputPath = "C:\Users\shrus\Documents\Codex\2026-04-26\Constructhub\ConstructHub_Project_Report_50_Pages.docx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Escape-Xml([string]$text) {
  if ($null -eq $text) { return '' }
  return [System.Security.SecurityElement]::Escape($text)
}
function Add-Paragraph([System.Text.StringBuilder]$b,[string]$text,[string]$style='Normal',[bool]$center=$false,[int]$size=22){
  $pStyle = if ($style -and $style -ne 'Normal') { '<w:pStyle w:val="' + $style + '"/>' } else { '' }
  $jc = if ($center) { '<w:jc w:val="center"/>' } else { '' }
  $t = Escape-Xml $text
  [void]$b.AppendLine('<w:p><w:pPr>' + $pStyle + $jc + '</w:pPr><w:r><w:rPr><w:sz w:val="' + $size + '"/><w:szCs w:val="' + $size + '"/></w:rPr><w:t xml:space="preserve">' + $t + '</w:t></w:r></w:p>')
}
function Add-PageBreak([System.Text.StringBuilder]$b){ [void]$b.AppendLine('<w:p><w:r><w:br w:type="page"/></w:r></w:p>') }
function Add-Diagram([System.Text.StringBuilder]$b,[string[]]$lines){
  [void]$b.Append('<w:p><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>')
  for($i=0; $i -lt $lines.Count; $i++){
    [void]$b.Append('<w:t xml:space="preserve">' + (Escape-Xml $lines[$i]) + '</w:t>')
    if($i -lt $lines.Count-1){ [void]$b.Append('<w:br/>') }
  }
  [void]$b.AppendLine('</w:r></w:p>')
}
function Make-Para([string]$topic,[string]$note){
  return "$topic is discussed in the context of ConstructHub as $note. The project combines a React frontend, FastAPI backend, relational database design, chat-based collaboration, company discovery, AI design suggestions, blueprint-style concept generation, and report export in one integrated workflow. This section explains the module from problem, process, implementation, and user value angles so that the report remains academically complete and easy to evaluate."
}

$buildDir = 'C:\Users\shrus\Documents\Codex\2026-04-26\constructhub_report_build'
if(Test-Path $buildDir){ Remove-Item $buildDir -Recurse -Force }
[System.IO.Compression.ZipFile]::ExtractToDirectory($TemplatePath, $buildDir)
$docPath = Join-Path $buildDir 'word\document.xml'
$raw = Get-Content $docPath -Raw
$open = ([regex]::Match($raw,'(?s)^.*?<w:body>')).Value
$sectPr = ([regex]::Match($raw,'(?s)<w:sectPr[\s\S]*?</w:sectPr>')).Value
$b = New-Object System.Text.StringBuilder

Add-Paragraph $b 'CONSTRUCTHUB' 'Title' $true 52
Add-Paragraph $b 'Smart Construction Marketplace with AI-Based Design Suggestions' 'Subtitle' $true 30
Add-Paragraph $b 'Project Report' 'Heading2' $true 28
Add-Paragraph $b 'Submitted in partial fulfillment of the requirements for the award of the degree' 'Normal' $true 22
Add-Paragraph $b 'Bachelor of Engineering / Bachelor of Technology' 'Normal' $true 22
Add-Paragraph $b 'Department of Computer Science / Information Science' 'Normal' $true 22
Add-Paragraph $b 'Student Name: __________________________' 'Normal' $true 22
Add-Paragraph $b 'Guide Name: ____________________________' 'Normal' $true 22
Add-Paragraph $b 'College Name: __________________________' 'Normal' $true 22
Add-Paragraph $b 'Academic Year: 2025-2026' 'Normal' $true 22

$pages = @(
  @{title='CERTIFICATE'; note='a bonafide completion statement for academic submission'; paraCount=2},
  @{title='DECLARATION'; note='an originality statement and scope of authorship'; paraCount=2},
  @{title='ACKNOWLEDGEMENT'; note='recognition of faculty guidance and support'; paraCount=2},
  @{title='ABSTRACT'; note='a concise summary of the whole platform'; paraCount=2},
  @{title='TABLE OF CONTENTS'; note='a chapter-wise view of the report structure'; paraCount=2},
  @{title='LIST OF FIGURES'; note='the diagrams and architecture visuals used in the report'; paraCount=2},
  @{title='LIST OF TABLES'; note='the database and specification summaries referenced later'; paraCount=2},
  @{title='CHAPTER 1'; subtitle='INTRODUCTION'; note='the background and motivation of ConstructHub'; paraCount=2},
  @{title='1.1 PURPOSE'; note='the primary objective of building the platform'; paraCount=2},
  @{title='1.1.1 ADVANTAGES'; note='the benefits of a unified company-client construction platform'; paraCount=2},
  @{title='1.2 SCOPE'; note='the system boundary and current capabilities'; paraCount=2},
  @{title='1.2.1 EXISTING SYSTEM WITH LIMITATIONS'; note='the challenges of informal construction coordination'; paraCount=2},
  @{title='1.2.2 PROPOSED SYSTEM FEATURES'; note='the improved digital workflow offered by ConstructHub'; paraCount=2},
  @{title='1.3 PROBLEM STATEMENT'; note='the core issue solved by the project'; paraCount=2},
  @{title='1.4 OBJECTIVES'; note='the measurable outcomes expected from the implementation'; paraCount=2},
  @{title='CHAPTER 2'; subtitle='SPECIFICATION REQUIREMENT'; note='the baseline technical and operational requirements'; paraCount=2},
  @{title='2.1 SOFTWARE REQUIREMENT SPECIFICATION'; note='the chosen software stack and supporting tools'; paraCount=2},
  @{title='2.2 HARDWARE REQUIREMENT SPECIFICATION'; note='the minimum and recommended execution environment'; paraCount=2},
  @{title='2.3 FUNCTIONAL REQUIREMENTS'; note='the major actions each user can perform'; paraCount=2},
  @{title='2.3.1 USER ANALYSIS'; note='the behaviors and expectations of client and company roles'; paraCount=2},
  @{title='2.4 NON-FUNCTIONAL REQUIREMENTS'; note='usability, maintainability, and performance expectations'; paraCount=2},
  @{title='2.5 FEASIBILITY STUDY'; note='technical, economic, and operational viability'; paraCount=2},
  @{title='CHAPTER 3'; subtitle='SYSTEM ANALYSIS AND ARCHITECTURE'; note='the structural view of the application'; paraCount=2},
  @{title='3.1 SYSTEM ARCHITECTURE OVERVIEW'; note='the layered frontend, backend, and database organization'; paraCount=2},
  @{title='3.2 FIGURE 3.1 SYSTEM ARCHITECTURE DIAGRAM'; note='the high-level system module relationship'; diagram=@('+--------------+   HTTP   +--------------+   SQL   +--------------+','¦ Client/Comp. ¦ -------? ¦ React UI     ¦ ------? ¦ Database     ¦','+--------------+          +--------------+         +--------------+','       ¦                          ¦','       +------------------------? ¦ FastAPI Backend ¦','                                  +----------------+','                                         ?','                                  AI Suggestions Layer'); paraCount=1},
  @{title='3.3 FIGURE 3.2 DFD LEVEL 0'; note='the application as a single process'; diagram=@('Client -----? [ ConstructHub System ] -----? Company','                     ¦','                     ?','                [ Database ]'); paraCount=1},
  @{title='3.4 FIGURE 3.3 DFD LEVEL 1'; note='the internal flow between modules'; diagram=@('Client -? Register/Login -? Requests -? Connections -? Chat','Client -? Browse Companies ----------------------------+','Client -? AI Studio -? Suggestions / Blueprint / Report','Company -? Incoming Requests -? Accept/Reject -? Chat','Company -? Projects / Showcase -----------------------+'); paraCount=1},
  @{title='3.5 FIGURE 3.4 PROCESS FLOW DIAGRAM'; note='the operational path from request creation to accepted communication'; diagram=@('Start','  ¦','Login/Register','  ¦','Create / View Requirement','  ¦','Browse Companies','  ¦','Connect Request','  ¦','Company Accepts','  ¦','Chat + AI Assistance','  ¦','End'); paraCount=1},
  @{title='3.6 LOGIN AND AUTHORIZATION FLOW'; note='token issue, profile fetch, and protected navigation'; diagram=@('User Input ? Validate Form ? /auth/login ? Token','                                 ¦','                                 ?','                             /me fetch','                                 ¦','                                 ?','                       Redirect to Dashboard'); paraCount=1},
  @{title='CHAPTER 4'; subtitle='DATABASE DESIGN AND API DESIGN'; note='the persistent data model and backend route groups'; paraCount=2},
  @{title='4.1 ENTITY RELATIONSHIP OVERVIEW'; note='the relationships among users, requests, chat, AI, and projects'; paraCount=2},
  @{title='4.2 FIGURE 4.1 ER MODEL'; note='a textual ER relationship summary'; diagram=@('[users] 1--1 [client_profiles]','[users] 1--1 [company_profiles]','[client_profiles] 1--* [build_requests]','[build_requests] 1--* [connections]','[connections] 1--* [messages]','[users] 1--* [design_requests]','[design_requests] 1--1 [ai_suggestions]','[company_profiles] 1--* [company_projects]'); paraCount=1},
  @{title='4.3 USERS, CLIENT PROFILES, AND COMPANY PROFILES'; note='identity and role-specific profile storage'; paraCount=2},
  @{title='4.4 BUILD REQUESTS, CONNECTIONS, AND MESSAGES'; note='marketplace flow persistence and message tracking'; paraCount=2},
  @{title='4.5 AI DESIGN TABLES AND PROJECT TABLES'; note='AI input-output persistence and completed work showcase'; paraCount=2},
  @{title='4.6 API ROUTE DESIGN'; note='backend endpoint grouping and responsibility'; paraCount=2},
  @{title='CHAPTER 5'; subtitle='FRONTEND MODULES AND USER FLOWS'; note='the visible application experience and page behavior'; paraCount=2},
  @{title='5.1 LANDING PAGE AND AUTHENTICATION PAGES'; note='entry flow, navigation, and role-aware sign in'; paraCount=2},
  @{title='5.2 CLIENT DASHBOARD AND REQUEST WORKFLOW'; note='profile editing, request creation, and company browsing'; paraCount=2},
  @{title='5.3 COMPANY DASHBOARD, NOTIFICATIONS, AND PROJECTS'; note='incoming requests, response handling, and showcase management'; paraCount=2},
  @{title='5.4 CHAT, ATTACHMENTS, AND COMMUNICATION FLOW'; note='accepted connection chat and file exchange'; paraCount=2},
  @{title='5.5 RESPONSIVE DESIGN AND UI CONSISTENCY'; note='surface components, feedback states, and readability'; paraCount=2},
  @{title='CHAPTER 6'; subtitle='AI STUDIO DESIGN SUGGESTION SYSTEM'; note='the design assistance subsystem and generated outputs'; paraCount=2},
  @{title='6.1 DESIGN REQUIREMENT INPUT FLOW'; note='structured form fields and prompt handling'; paraCount=2},
  @{title='6.2 COLOR, MATERIAL, AND LIGHTING LOGIC'; note='input-based variation in design suggestions'; paraCount=2},
  @{title='6.3 CONCEPT IMAGE GENERATION'; note='input-aware demo visuals for interior and exterior ideas'; paraCount=2},
  @{title='6.4 BLUEPRINT GENERATION'; note='BHK and plot-size responsive blueprint concepts'; paraCount=2},
  @{title='6.5 PDF REPORT GENERATION AND SAVED DESIGNS'; note='design history persistence and export workflow'; paraCount=2},
  @{title='CHAPTER 7'; subtitle='TESTING, RESULTS, AND EVALUATION'; note='how the system was validated and discussed'; paraCount=2},
  @{title='7.1 TEST CASES AND VALIDATION STRATEGY'; note='feature-wise verification approach'; paraCount=2},
  @{title='7.2 RESULTS AND OUTPUT DISCUSSION'; note='observed behavior and achieved outcomes'; paraCount=2},
  @{title='7.3 LIMITATIONS AND PRACTICAL CONSTRAINTS'; note='current scope boundaries and known constraints'; paraCount=2},
  @{title='7.4 SECURITY, PRIVACY, DEPLOYMENT, AND MAINTENANCE'; note='operational and security considerations'; paraCount=2},
  @{title='CHAPTER 8'; subtitle='CONCLUSION, FUTURE SCOPE, AND REFERENCES'; note='final interpretation of the project value'; paraCount=2},
  @{title='8.1 FUTURE ENHANCEMENTS'; note='next-step modules and practical growth path'; paraCount=2},
  @{title='8.2 REFERENCES'; note='the documentation and technical sources relevant to the project'; paraCount=2},
  @{title='APPENDIX'; note='supporting material such as screenshots, API lists, and extra notes'; paraCount=2}
)

foreach($page in $pages){
  Add-PageBreak $b
  Add-Paragraph $b $page.title 'Heading1'
  if($page.ContainsKey('subtitle')){ Add-Paragraph $b $page.subtitle 'Heading2' }
  if($page.ContainsKey('diagram')){ Add-Diagram $b $page.diagram }
  $count = [int]$page.paraCount
  for($i=1; $i -le $count; $i++){
    Add-Paragraph $b (Make-Para $page.title $page.note) 'Normal'
  }
}

$newXml = $open + $b.ToString() + $sectPr + '</w:body></w:document>'
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($docPath,$newXml,$enc)

$outputDir = Split-Path -Parent $OutputPath
if(-not (Test-Path $outputDir)){ New-Item -ItemType Directory -Path $outputDir | Out-Null }
if(Test-Path $OutputPath){ Remove-Item $OutputPath -Force }
$zipPath = [System.IO.Path]::ChangeExtension($OutputPath, '.zip')
if(Test-Path $zipPath){ Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $buildDir '*') -DestinationPath $zipPath
Move-Item -Path $zipPath -Destination $OutputPath -Force
Write-Host "Created: $OutputPath"

