# Capture the Chrome window that belongs to the Playwright user-data-dir.
#
#   powershell -ExecutionPolicy Bypass -File capture-window.ps1 `
#       -Path submission\screenshot.png `
#       -ProfileDir C:\path\to\playwright-profile
#
# The script finds the browser process whose command line references the
# Playwright profile, stretches its window over the whole screen, raises it
# above every other window and saves the screen bitmap (browser chrome +
# address bar + page) to -Path.
param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$ProfileDir
)

Add-Type -AssemblyName System.Windows.Forms, System.Drawing

Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CapWindow {
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
"@

[CapWindow]::SetProcessDPIAware() | Out-Null

$HWND_TOPMOST = [IntPtr](-1)
$HWND_NOTOPMOST = [IntPtr](-2)
$SWP_SHOWWINDOW = 0x0040
$SW_RESTORE = 9

$pattern = $ProfileDir.ToLower()
$browserProcess = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" |
    Where-Object {
        $_.CommandLine -and
        $_.CommandLine.ToLower().Contains($pattern) -and
        $_.CommandLine -notmatch '--type='
    } |
    Select-Object -First 1

if (-not $browserProcess) {
    Write-Error "No Chrome browser process found for profile '$ProfileDir'"
    exit 1
}

$browserPid = [uint32]$browserProcess.ProcessId
$script:windowHandle = [IntPtr]::Zero
$script:windowTitle = ""

$callback = {
    param([IntPtr]$hWnd, [IntPtr]$lParam)
    $ownerPid = [uint32]0
    [CapWindow]::GetWindowThreadProcessId($hWnd, [ref]$ownerPid) | Out-Null
    if ($ownerPid -eq $browserPid -and [CapWindow]::IsWindowVisible($hWnd)) {
        $length = [CapWindow]::GetWindowTextLength($hWnd)
        if ($length -gt 0) {
            $buffer = New-Object System.Text.StringBuilder ($length + 1)
            [CapWindow]::GetWindowText($hWnd, $buffer, $buffer.Capacity) | Out-Null
            $script:windowHandle = $hWnd
            $script:windowTitle = $buffer.ToString()
            return $false
        }
    }
    return $true
}

[CapWindow]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null

if ($script:windowHandle -eq [IntPtr]::Zero) {
    Write-Error "No visible Chrome window found for PID $browserPid"
    exit 1
}

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

[CapWindow]::ShowWindow($script:windowHandle, $SW_RESTORE) | Out-Null
[CapWindow]::SetWindowPos($script:windowHandle, $HWND_TOPMOST, 0, 0, $screen.Width, $screen.Height, $SWP_SHOWWINDOW) | Out-Null
[CapWindow]::SetForegroundWindow($script:windowHandle) | Out-Null
Start-Sleep -Milliseconds 900

$bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size $screen.Width, $screen.Height))

$full = if ([System.IO.Path]::IsPathRooted($Path)) {
    [System.IO.Path]::GetFullPath($Path)
} else {
    [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}
$directory = [System.IO.Path]::GetDirectoryName($full)
if (-not (Test-Path $directory)) { New-Item -ItemType Directory -Force -Path $directory | Out-Null }
$bitmap.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

[CapWindow]::SetWindowPos($script:windowHandle, $HWND_NOTOPMOST, 0, 0, 0, 0, 0x0001 -bor 0x0002) | Out-Null

Write-Output ("captured {0} ({1}x{2}) title='{3}'" -f $full, $screen.Width, $screen.Height, $script:windowTitle)
