/**
 * PWA Registration & Installation Handler
 * Mini Makers Robotics IDE
 */

// 1. Registro do Service Worker com caminho relativo (compatível com GitHub Pages)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado com sucesso no escopo:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

// 2. Gerenciamento do Botão de Instalação (beforeinstallprompt)
let deferredPrompt = null;

window.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('btn-install-pwa');

  // Verificar se já está rodando como aplicativo instalado (Standalone)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone && installBtn) {
    installBtn.style.display = 'none';
  }

  // Capturar evento de instalação do navegador
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o banner padrão do navegador
    e.preventDefault();
    deferredPrompt = e;

    // Exibir o botão de instalação na interface
    if (installBtn && !isStandalone) {
      installBtn.style.display = 'inline-flex';
    }
  });

  // Ação ao clicar no botão de instalação
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      // Exibe o prompt nativo de instalação
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Escolha do usuário para instalação: ${outcome}`);

      // Limpa a referência e esconde o botão
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  // Esconder botão quando o app for instalado com sucesso
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplicativo instalado com sucesso!');
    deferredPrompt = null;
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  });
});
