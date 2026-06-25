param(
  [string]$Enabled = "1",
  [string]$AutoStart = "0",
  [string]$CanAutoStart = "1",
  [string]$StartHidden = "0",
  [string]$Port = "7421",
  [string]$RunValue = "THEBOX Engine",
  [string]$StartupCommand = ""
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
$script:syncingAutoStart = $false
function Send-Command([string]$value) {
  [Console]::Out.WriteLine($value)
  [Console]::Out.Flush()
}
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
# Le o estado real direto do registro (fonte da verdade, sem depender do motor).
function Get-AutoStartState {
  try {
    $item = Get-ItemProperty -Path $runKey -Name $RunValue -ErrorAction Stop
    return [bool]$item.$RunValue
  } catch {
    return $false
  }
}
# Escreve/remove a entrada de inicializacao e devolve o estado resultante.
function Set-AutoStartState([bool]$on) {
  try {
    if ($on) {
      Set-ItemProperty -Path $runKey -Name $RunValue -Value $StartupCommand -Force -ErrorAction Stop
    } else {
      Remove-ItemProperty -Path $runKey -Name $RunValue -Force -ErrorAction SilentlyContinue
    }
  } catch {
    # sem permissao/erro: o Get abaixo reflete o estado real
  }
  return Get-AutoStartState
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
# CheckBox em modo Botao: o estado (ligado/desligado) fica visivel mesmo no tema
# escuro, ao contrario do tique padrao do FlatStyle que some no fundo preto.
$startup = New-Object Windows.Forms.CheckBox
$startup.Location = New-Object Drawing.Point(20, 140)
$startup.Size = New-Object Drawing.Size(318, 36)
$startup.Appearance = [Windows.Forms.Appearance]::Button
$startup.TextAlign = [Drawing.ContentAlignment]::MiddleCenter
$startup.FlatStyle = [Windows.Forms.FlatStyle]::Flat
$startup.FlatAppearance.BorderSize = 2
$startup.FlatAppearance.BorderColor = $orange
$startup.FlatAppearance.CheckedBackColor = $orange
$startup.Font = New-Object Drawing.Font("Consolas", 10)
$startup.Enabled = $CanAutoStart -eq "1"
$script:canAutoStart = $startup.Enabled
# Estado inicial vem do registro (verdade), nao so do parametro.
$startup.Checked = if ($script:canAutoStart) { Get-AutoStartState } else { $AutoStart -eq "1" }
$form.Controls.Add($startup)
function Update-AutoStartVisual {
  if (-not $script:canAutoStart) {
    $startup.Text = "Iniciar com o Windows (so no .exe)"
    $startup.ForeColor = $gray
    return
  }
  if ($startup.Checked) {
    $startup.Text = "Iniciar com o Windows: LIGADO"
    $startup.ForeColor = $black
  } else {
    $startup.Text = "Iniciar com o Windows: DESLIGADO"
    $startup.ForeColor = $white
    $startup.BackColor = $black
  }
}
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
  if ($script:initializing -or $script:syncingAutoStart -or -not $script:canAutoStart) { return }
  $real = Set-AutoStartState $startup.Checked
  if ($real -ne $startup.Checked) {
    $script:syncingAutoStart = $true
    $startup.Checked = $real
    $script:syncingAutoStart = $false
  }
  Update-AutoStartVisual
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
Update-AutoStartVisual
$script:initializing = $false
[Windows.Forms.Application]::Run($form)
