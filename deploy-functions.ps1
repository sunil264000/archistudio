# Local deployment script using npx and supabase CLI
param (
    [string]$Function = "all",
    [string]$ProjectRef = "ddvfcymvhnlvqcbhozpc"
)

Write-Host "Starting Supabase Edge Functions deployment..." -ForegroundColor Cyan

# Requires you to be logged in to Supabase CLI. 
# If it asks for login, it will open the browser.
if ($Function -eq "all") {
    Write-Host "Deploying ALL Edge Functions..." -ForegroundColor Yellow
    npx --yes supabase@latest functions deploy --project-ref $ProjectRef
} else {
    Write-Host "Deploying Edge Function: $Function..." -ForegroundColor Yellow
    npx --yes supabase@latest functions deploy $Function --project-ref $ProjectRef
}

Write-Host "Deployment completed!" -ForegroundColor Green
