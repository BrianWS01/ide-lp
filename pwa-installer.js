/**
 * PWA Registration & Installation Handler
 * Mini Makers Robotics IDE
 */

// 1. Registro do Service Worker com caminho relativo (compatível com GitHub Pages)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado no escopo:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

let deferredPrompt = null;

// Redirecionamento automático se aberto em modo Standalone (App) fora da IDE
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
if (isStandalone && !window.location.pathname.endsWith('ide.html')) {
  window.location.href = './ide.html';
}

window.addEventListener('DOMContentLoaded', () => {
  const installButtons = document.querySelectorAll('.btn-install-pwa');

  // Capturar evento de instalação do navegador
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Evento beforeinstallprompt capturado!');

    // Mostrar botões de instalação se não estiver em modo standalone
    if (!isStandalone) {
      installButtons.forEach((btn) => {
        if (btn.tagName === 'BUTTON') {
          btn.style.display = 'inline-flex';
        }
      });
    }
  });

  // Configurar clique em todos os botões de instalação
  installButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      if (deferredPrompt) {
        // Dispara o prompt nativo de instalação da PWA
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Escolha do usuário: ${outcome}`);
        deferredPrompt = null;

        // Se o usuário instalou, redireciona para a IDE
        if (outcome === 'accepted') {
          window.location.href = './ide.html';
        }
      } else {
        // Se a PWA já estiver instalada ou o navegador não suportar o prompt, abre a IDE direto
        window.location.href = './ide.html';
      }
    });
  });

  // Esconder botões após instalação concluída
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplicativo instalado com sucesso!');
    deferredPrompt = null;
    installButtons.forEach((btn) => {
      if (btn.tagName === 'BUTTON' && btn.id === 'btn-install-pwa') {
        btn.style.display = 'none';
      }
    });
    // Redirecionar para a IDE se o usuário ainda estiver na landing page
    if (!window.location.pathname.endsWith('ide.html')) {
      window.location.href = './ide.html';
    }
  });
});
