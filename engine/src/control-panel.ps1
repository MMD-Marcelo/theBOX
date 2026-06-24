param(
  [string]$Enabled = "1",
  [string]$AutoStart = "0",
  [string]$CanAutoStart = "1",
  [string]$StartHidden = "0",
  [string]$Port = "7421"
)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$orange = [Drawing.Color]::FromArgb(255, 90, 0)
$black = [Drawing.Color]::FromArgb(10, 10, 10)
$white = [Drawing.Color]::White
$gray = [Drawing.Color]::FromArgb(145, 145, 145)
$script:isEnabled = $Enabled -eq "1"
$script:allowExit = $false
$script:initializing = $true
function Send-Command([string]$value) {
  [Console]::Out.WriteLine($value)
  [Console]::Out.Flush()
}
$form = New-Object Windows.Forms.Form
$form.Text = "THEBOX Engine"
$form.ClientSize = New-Object Drawing.Size(360, 194)
$form.FormBorderStyle = [Windows.Forms.FormBorderStyle]::FixedSingle
$form.MaximizeBox = $false
$form.StartPosition = [Windows.Forms.FormStartPosition]::CenterScreen
$form.BackColor = $black
$form.ForeColor = $white
$form.Font = New-Object Drawing.Font("Consolas", 10)
$form.Icon = [Drawing.SystemIcons]::Application
$title = New-Object Windows.Forms.Label
$title.Text = "THEBOX ENGINE"
$title.Location = New-Object Drawing.Point(20, 16)
$title.Size = New-Object Drawing.Size(220, 24)
$title.Font = New-Object Drawing.Font("Consolas", 15)
$title.ForeColor = $white
$form.Controls.Add($title)
$marker = New-Object Windows.Forms.Panel
$marker.Location = New-Object Drawing.Point(315, 17)
$marker.Size = New-Object Drawing.Size(22, 22)
$form.Controls.Add($marker)
$status = New-Object Windows.Forms.Label
$status.Location = New-Object Drawing.Point(20, 49)
$status.Size = New-Object Drawing.Size(318, 18)
$status.ForeColor = $orange
$form.Controls.Add($status)
$toggle = New-Object Windows.Forms.Button
$toggle.Location = New-Object Drawing.Point(20, 78)
$toggle.Size = New-Object Drawing.Size(318, 48)
$toggle.FlatStyle = [Windows.Forms.FlatStyle]::Flat
$toggle.FlatAppearance.BorderSize = 2
$toggle.FlatAppearance.BorderColor = $orange
$toggle.Font = New-Object Drawing.Font("Consolas", 11)
$toggle.UseVisualStyleBackColor = $false
$form.Controls.Add($toggle)
$startup = New-Object Windows.Forms.CheckBox
$startup.Location = New-Object Drawing.Point(20, 145)
$startup.Size = New-Object Drawing.Size(318, 28)
$startup.Text = "Iniciar com o Windows"
$startup.ForeColor = $white
$startup.FlatStyle = [Windows.Forms.FlatStyle]::Flat
$startup.Checked = $AutoStart -eq "1"
$startup.Enabled = $CanAutoStart -eq "1"
if (-not $startup.Enabled) {
  $startup.Text = "Iniciar com o Windows (disponivel no .exe)"
  $startup.ForeColor = $gray
}
$form.Controls.Add($startup)
function Update-State {
  if ($script:isEnabled) {
    $status.Text = "LIGADO - 127.0.0.1:$Port"
    $marker.BackColor = $orange
    $toggle.Text = "DESLIGAR"
    $toggle.BackColor = $orange
    $toggle.ForeColor = $black
  } else {
    $status.Text = "DESLIGADO"
    $marker.BackColor = $gray
    $toggle.Text = "LIGAR"
    $toggle.BackColor = $black
    $toggle.ForeColor = $white
  }
}
$toggle.Add_Click({
  $script:isEnabled = -not $script:isEnabled
  Update-State
  if ($script:isEnabled) { Send-Command "toggle:on" } else { Send-Command "toggle:off" }
})
$startup.Add_CheckedChanged({
  if ($script:initializing -or -not $startup.Enabled) { return }
  if ($startup.Checked) { Send-Command "autostart:on" } else { Send-Command "autostart:off" }
})
$menu = New-Object Windows.Forms.ContextMenuStrip
$openItem = $menu.Items.Add("Abrir")
$exitItem = $menu.Items.Add("Encerrar")
$tray = New-Object Windows.Forms.NotifyIcon
$tray.Text = "THEBOX Engine"
$tray.Icon = [Drawing.SystemIcons]::Application
$tray.ContextMenuStrip = $menu
$tray.Visible = $true
$showWindow = {
  $form.Show()
  $form.WindowState = [Windows.Forms.FormWindowState]::Normal
  $form.ShowInTaskbar = $true
  $form.Activate()
}
$openItem.Add_Click($showWindow)
$tray.Add_DoubleClick($showWindow)
$exitItem.Add_Click({
  $script:allowExit = $true
  Send-Command "exit"
  $tray.Visible = $false
  $tray.Dispose()
  $form.Close()
})
$form.Add_FormClosing({
  param($sender, $eventArgs)
  if (-not $script:allowExit) {
    $eventArgs.Cancel = $true
    $form.Hide()
    $form.ShowInTaskbar = $false
  }
})
$form.Add_Shown({
  if ($StartHidden -eq "1") {
    $form.Hide()
    $form.ShowInTaskbar = $false
  }
})
Update-State
$script:initializing = $false
[Windows.Forms.Application]::Run($form)
