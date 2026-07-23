// RoboFlow Robotics Interactivity

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar transparent to solid on scroll
    const navbar = document.querySelector('#navbar-main');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('scrolled');
            navbar.classList.remove('shadow-lg');
        }
    });

    // 2. Smooth scrolling for all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        });
    });

    // 3. Simple Form Handling
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;

            // Visual feedback
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = 'Mensagem Enviada!';
                btn.classList.replace('btn-cyan', 'btn-success');
                contactForm.reset();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.replace('btn-success', 'btn-cyan');
                    btn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }

    // 4. Reveal Animations on Scroll (Simple implementation)
    const revealElements = document.querySelectorAll('.hover-lift, .card, .img-fluid');
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // 5. Maze Interactive Sequence Builder Implementation
    const mazeContainer = document.getElementById('mazeGrid');
    const runMazeBtn = document.getElementById('run-maze-game');
    const levelSelectors = document.querySelectorAll('#maze-level-selector .btn');
    
    // UI Elements for Interactive Building
    const workspaceList = document.getElementById('user-blocks-list');
    const codeView = document.getElementById('dynamic-code-view');
    const msgBox = document.getElementById('maze-message');
    const btnClear = document.getElementById('clear-workspace');
    const btnAdds = document.querySelectorAll('.puz-add');

    // 0: Path, 1: Wall, 2: Goal, 3: Start
    const mazeLevels = [
        { id: 1, layout: [[1,1,1,1,1],[1,1,1,1,1],[3,0,0,0,2],[1,1,1,1,1],[1,1,1,1,1]], start: { r: 2, c: 0, d: 90 } },
        { id: 2, layout: [[1,1,1,1,1],[1,1,2,1,1],[1,1,0,1,1],[3,0,0,1,1],[1,1,1,1,1]], start: { r: 3, c: 0, d: 90 } },
        { id: 3, layout: [[1,1,1,1,1],[1,1,1,0,2],[3,0,0,0,1],[1,1,1,1,1],[1,1,1,1,1]], start: { r: 2, c: 0, d: 90 } },
        { id: 4, layout: [[1,1,1,1,2],[1,1,1,0,0],[1,1,0,0,1],[1,0,0,1,1],[3,0,1,1,1]], start: { r: 4, c: 0, d: 90 } },
        { id: 5, layout: [[1,1,2,1,1],[1,1,0,1,1],[1,1,0,1,1],[3,0,0,1,1],[1,1,1,1,1]], start: { r: 3, c: 0, d: 90 } }
    ];

    let currentLevel = 1;
    let isRunning = false;
    let avatarEl = null;

    // Fix backdrop issues by ensuring modals are direct children of body
    let victoryModalEl = document.getElementById('victoryModal');
    let blocklyModalEl = document.getElementById('blocklyModal');
    if (victoryModalEl && victoryModalEl.parentNode !== document.body) document.body.appendChild(victoryModalEl);
    if (blocklyModalEl && blocklyModalEl.parentNode !== document.body) document.body.appendChild(blocklyModalEl);

    let victoryModal = new bootstrap.Modal(victoryModalEl, { backdrop: true });
    let blocklyModal = new bootstrap.Modal(blocklyModalEl, { backdrop: true });
    let btnNextMission = document.getElementById('btn-next-mission');

    // Interactive Building Logic
    function clearWorkspace() {
        if (isRunning) return;
        workspaceList.innerHTML = '<div class="dynamic-block dyn-event dyn-hat" style="z-index: 100;">quando iniciar</div>';
        codeView.innerHTML = '';
        showMessage('', '');
        renderMaze(currentLevel); // reset avatar pos
        updateCodeView();
    }

    if (btnClear) btnClear.addEventListener('click', clearWorkspace);

    // --- Drag and Drop Logic ---
    let draggedBlock = null;
    let dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    dropIndicator.style.display = 'none'; // hide initially

    function initDraggable(el) {
        el.setAttribute('draggable', 'true');
        el.addEventListener('dragstart', (e) => {
            if (isRunning) { e.preventDefault(); return; }
            draggedBlock = el;
            setTimeout(() => el.classList.add('opacity-50'), 0);
            e.dataTransfer.effectAllowed = 'move';
        });
        
        el.addEventListener('dragend', () => {
            if(draggedBlock) draggedBlock.classList.remove('opacity-50');
            draggedBlock = null;
            if (dropIndicator.parentNode) dropIndicator.parentNode.removeChild(dropIndicator);
            updateZIndexes();
            updateCodeView();
        });
    }

    function initDropzone(el) {
        el.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.classList.add('bg-hover-drop');
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary for drop to work
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            
            if (draggedBlock && draggedBlock !== el && !draggedBlock.contains(el)) {
                dropIndicator.style.display = 'block';
                const afterElement = getDragAfterElement(el, e.clientY);
                if (afterElement == null) {
                    el.appendChild(dropIndicator);
                } else {
                    el.insertBefore(dropIndicator, afterElement);
                }
            }
        });

        el.addEventListener('dragleave', (e) => {
             e.stopPropagation();
             // Prevent flicker when dragging over children
             if (!el.contains(e.relatedTarget)) {
                el.classList.remove('bg-hover-drop');
                if (el === dropIndicator.parentNode && e.relatedTarget !== dropIndicator) {
                     // remove indicator when leaving dropzone entirely
                     // dropIndicator.parentNode.removeChild(dropIndicator);
                }
             }
        });

        el.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.classList.remove('bg-hover-drop');
            if (dropIndicator.parentNode) dropIndicator.parentNode.removeChild(dropIndicator);

            if (draggedBlock && draggedBlock !== el && !draggedBlock.contains(el)) {
                // Determine insertion point based on cursor Y
                const afterElement = getDragAfterElement(el, e.clientY);
                if (afterElement == null) {
                    el.appendChild(draggedBlock);
                } else {
                    el.insertBefore(draggedBlock, afterElement);
                }
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.dynamic-block:not(.opacity-50), .dyn-loop-wrapper:not(.opacity-50)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateZIndexes() {
        // Authenticity: Blockly blocks overlap with highest z-index at the top
        const items = workspaceList.querySelectorAll('.dynamic-block, .dyn-loop-wrapper');
        items.forEach((item, index) => {
            item.style.zIndex = 1000 - index;
        });
    }

    // Initialize MAIN dropzone
    initDropzone(workspaceList);

    btnAdds.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isRunning) return;
            const action = e.currentTarget.getAttribute('data-action');
            
            let newEl;

            if (action === 'loop') {
                // Add UI Block (C-Shape)
                newEl = document.createElement('div');
                newEl.className = 'dyn-loop-wrapper mb-1';
                newEl.setAttribute('data-type', 'loop');
                
                const head = document.createElement('div');
                head.className = 'dyn-loop-header';
                head.innerHTML = 'repetir até <i class="bi bi-geo-alt-fill text-danger"></i>';
                
                const body = document.createElement('div');
                body.className = 'dyn-loop-body';
                initDropzone(body); // Inner body is a dropzone
                
                const foot = document.createElement('div');
                foot.className = 'dyn-loop-footer';
                
                newEl.appendChild(head);
                newEl.appendChild(body);
                newEl.appendChild(foot);
                
            } else {
                // Append Block UI
                newEl = document.createElement('div');
                let blockClass = 'dyn-action'; // purple
                let blockText = 'mover frente';
                
                if (action === 'l') { blockText = 'virar esquerda ↺'; }
                if (action === 'r') { blockText = 'virar direita ↻';  }
                
                newEl.className = `dynamic-block ${blockClass} mb-1`;
                newEl.setAttribute('data-type', action);
                newEl.innerHTML = blockText;
            }
            
            initDraggable(newEl);

            // Click to delete logic
            newEl.addEventListener('click', (e) => {
                if(isRunning) return;
                // e.stopPropagation() so that clicking inner block doesn't delete outer loop
                e.stopPropagation();
                newEl.style.transform = 'scale(0)';
                newEl.style.transition = 'transform 0.2s';
                setTimeout(() => {
                    if (newEl.parentNode) newEl.parentNode.removeChild(newEl);
                    updateZIndexes();
                    updateCodeView();
                }, 200);
            });

            workspaceList.appendChild(newEl);
            updateZIndexes();
            updateCodeView();
            workspaceList.parentElement.scrollTop = workspaceList.parentElement.scrollHeight;
        });
    });

    // Code View Generator (AST from DOM)
    function updateCodeView() {
        codeView.innerHTML = '';
        const blocks = Array.from(workspaceList.children).slice(1); // skip "quando iniciar" hat
        generateCodeHTML(blocks, codeView, 1);
    }

    function generateCodeHTML(elements, container, indentLevel) {
        const indentStr = '&nbsp;&nbsp;'.repeat(indentLevel);
        elements.forEach(el => {
            const codeEl = document.createElement('div');
            codeEl.className = 'cl';
            const type = el.getAttribute('data-type');
            
            if (type === 'loop') {
                codeEl.innerHTML = `${indentStr}<span class="text-warning">while</span> (<span class="text-info">notAtGoal</span>()) {`;
                container.appendChild(codeEl);
                
                const bodyContainer = document.createElement('div');
                container.appendChild(bodyContainer);
                const innerBlocks = Array.from(el.querySelector('.dyn-loop-body').children);
                generateCodeHTML(innerBlocks, bodyContainer, indentLevel + 1);
                
                const codeFoot = document.createElement('div');
                codeFoot.className = 'cl';
                codeFoot.innerHTML = `${indentStr}}`;
                container.appendChild(codeFoot);
            } else if (type) {
                let codeText = 'moveForward()';
                if (type === 'l') codeText = 'turnLeft()';
                if (type === 'r') codeText = 'turnRight()';
                
                codeEl.innerHTML = `${indentStr}<span class="cfn">${codeText}</span>;`;
                container.appendChild(codeEl);
            }
        });
    }

    function showMessage(text, type='text-muted') {
        if (!msgBox) return;
        msgBox.innerHTML = `<span class="text-${type}">${text}</span>`;
    }

    function renderMaze(levelId) {
        if (!mazeContainer) return;
        const level = mazeLevels.find(l => l.id === parseInt(levelId));
        mazeContainer.innerHTML = '';
        showMessage(`Pronto para Nível ${levelId}`, 'muted');
        
        level.layout.forEach((row, r) => {
            row.forEach((cell, c) => {
                const cellEl = document.createElement('div');
                cellEl.className = 'maze-cell';
                if (cell === 1) cellEl.classList.add('wall');
                if (cell === 2) {
                    cellEl.classList.add('goal');
                    cellEl.innerHTML = '<i class="bi bi-flag-fill text-success fs-4"></i>';
                }
                
                if (cell === 3) {
                    avatarEl = document.createElement('div');
                    avatarEl.className = 'maze-avatar';
                    avatarEl.innerHTML = '<i class="bi bi-robot"></i>';
                    avatarEl.style.transform = `rotate(${level.start.d}deg)`; 
                    avatarEl.dataset.r = r;
                    avatarEl.dataset.c = c;
                    avatarEl.dataset.d = level.start.d;

                    cellEl.appendChild(avatarEl);
                }
                mazeContainer.appendChild(cellEl);
            });
        });
    }

    // Initialize
    if (mazeContainer) renderMaze(1);

    // Level Selection Logic
    function loadLevel(targetLevel) {
        if (isRunning) return;
        levelSelectors.forEach(b => b.classList.remove('active'));
        const nextLevelBtn = levelSelectors[targetLevel - 1]; // 0-indexed
        
        if (nextLevelBtn) {
            nextLevelBtn.classList.add('active');
            currentLevel = targetLevel;
            clearWorkspace();
        }
    }

    levelSelectors.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = parseInt(e.target.getAttribute('data-level'));
            loadLevel(target);
        });
    });

    // Next Mission Button Logic
    if (btnNextMission) {
        btnNextMission.addEventListener('click', () => {
             victoryModal.hide();
             if (currentLevel < levelSelectors.length) {
                 loadLevel(currentLevel + 1);
             }
        });
    }

    // Parser function for execution
    function parseDOMTree(container) {
        const sequence = [];
        const elements = Array.from(container.children);
        
        elements.forEach(el => {
            if(el.classList.contains('dyn-hat')) return; // skip header
            
            const type = el.getAttribute('data-type');
            if (type === 'loop') {
                const innerBody = el.querySelector('.dyn-loop-body');
                sequence.push({
                    type: 'loop',
                    moves: parseDOMTree(innerBody)
                });
            } else if (type) {
                sequence.push(type);
            }
        });
        return sequence;
    }

    // Run Simulation
    if (runMazeBtn) {
        runMazeBtn.addEventListener('click', async () => {
            if (isRunning) return;
            
            const programSequence = parseDOMTree(workspaceList);
            if(programSequence.length === 0) {
                 showMessage("Adicione blocos primeiro!", 'danger');
                 return;
            }
            
            // Reset to start pos before running sequence
            renderMaze(currentLevel); 
            
            isRunning = true;
            runMazeBtn.innerHTML = '<i class="bi bi-stop-circle me-1"></i> Rodando...';
            runMazeBtn.disabled = true;
            showMessage("Executando...", "primary");

            const level = mazeLevels.find(l => l.id === currentLevel);
            let r = parseInt(avatarEl.dataset.r);
            let c = parseInt(avatarEl.dataset.c);
            let d = parseInt(avatarEl.dataset.d);
            let success = false;
            let crashed = false;

            async function runSequence(sequence, isLoop) {
                let maxIters = isLoop ? 100 : 1;
                for (let iter = 0; iter < maxIters; iter++) {
                    for (let move of sequence) {
                        if (crashed || success) return;

                        if (typeof move === 'object' && move.type === 'loop') {
                            await runSequence(move.moves, true);
                            if (crashed || success) return;
                            continue;
                        }

                        // Normal moves
                        if (move === 'f') {
                            let dNorm = ((d % 360) + 360) % 360;
                            if (dNorm === 0) r -= 1; // North
                            else if (dNorm === 90) c += 1; // East 
                            else if (dNorm === 180) r += 1; // South
                            else if (dNorm === 270) c -= 1; // West
                            
                            // Boundary check
                            if (r < 0 || r > 4 || c < 0 || c > 4) {
                                showMessage("Caiu fora do labirinto! 😵", 'danger');
                                crashed = true; 
                                return;
                            }
                            
                            // Wall check
                            if (level.layout[r][c] === 1) {
                                showMessage("Bateu na parede! 💥", 'danger');
                                avatarEl.style.animation = 'carShake 0.3s';
                                crashed = true;
                                return;
                            }

                            // Move visually
                            const cells = document.querySelectorAll('.maze-cell');
                            const nextCell = cells[r * 5 + c];
                            if(nextCell) nextCell.appendChild(avatarEl);
                            
                        } else if (move === 'l') {
                            d -= 90;
                            avatarEl.style.transform = `rotate(${d}deg)`;
                        } else if (move === 'r') {
                            d += 90;
                            avatarEl.style.transform = `rotate(${d}deg)`;
                        }

                        // Wait between moves
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Goal check mid-flight
                        if (level.layout[r][c] === 2) {
                            success = true;
                            return; 
                        }
                    }
                    if (!isLoop) break;
                }
            }

            // Start recursion over the top-level block sequence
            await runSequence(programSequence, false);

            // Results
            if (success) {
                avatarEl.style.filter = "drop-shadow(0 0 10px #00E676)";
                showMessage(`Nível ${currentLevel} concluído!`, 'success');
                
                if (currentLevel < levelSelectors.length) {
                    // Show gamified modal for next mission
                    document.getElementById('victoryModalTitle').innerHTML = `🎉 Nível ${currentLevel} Concluído! 🎉`;
                    btnNextMission.style.display = 'inline-block';
                    victoryModal.show();
                } else {
                    // Final Game Win
                    document.getElementById('victoryModalTitle').innerHTML = `🏆 PARABÉNS! VOCÊ ZEROU! 🏆`;
                    document.getElementById('victoryMessage').innerHTML = `Você completou todas as missões robóticas da plataforma!`;
                    btnNextMission.style.display = 'none'; // hide next mission since there is none
                    victoryModal.show();
                }
            } else if (!crashed) {
                showMessage("Faltou blocos para chegar ao fim! 🤔", 'warning');
            }

            runMazeBtn.innerHTML = '<i class="bi bi-play-circle me-1"></i> Executar Programa';
            runMazeBtn.disabled = false;
            isRunning = false;
        });
    }

    // 6. Blockly Categories Modal Logic
    const blocklyOptions = document.querySelectorAll('.blockly-option');
    const modalTitle = document.querySelector('#blocklyModalTitle');
    const modalBody = document.querySelector('#blocklyModalBody');
    const blocklyModalElement = document.getElementById('blocklyModal');

    // Check if Bootstrap is available and element exists
    if (blocklyOptions.length > 0 && blocklyModalElement) {
        const bsModal = new bootstrap.Modal(blocklyModalElement);
        const modalIcon = document.getElementById('blocklyModalIcon');

        const categoryInfo = {
            'Movimento': {
                icon: '<i class="bi bi-arrows-move text-success"></i>',
                text: 'Com os blocos de <strong>Movimento</strong>, você controla a direção e velocidade do seu robô. É aqui que os alunos aprendem sobre vetores, eixos X/Y e controle de motores mecânicos!'
            },
            'Sensores': {
                icon: '<i class="bi bi-radar text-info"></i>',
                text: 'Os <strong>Sensores</strong> são o cérebro do robô! Eles permitem detectar obstáculos, seguir linhas no chão e até medir a distância de objetos. Fundamental para a automação na vida real.'
            },
            'Lógica': {
                icon: '<i class="bi bi-diagram-3-fill text-primary"></i>',
                text: 'A <strong>Lógica</strong> ensina o pensamento computacional. Usando "E", "OU" e condicionais (SE/ENTÃO), o aluno cria as regras que o robô deve seguir para tomar decisões inteligentes.'
            },
            'Sons': {
                icon: '<i class="bi bi-speaker-fill text-warning"></i>',
                text: 'A seção de <strong>Sons</strong> permite que o robô se comunique com o mundo! Toque bipes curtos, melodias ou alertas sonoros baseados nos eventos da programação.'
            },
            'Variáveis': {
                icon: '<i class="bi bi-box-seam-fill text-purple"></i>',
                text: 'As <strong>Variáveis</strong> funcionam como caixas que permitem guardar informações importantes na memória, como o número de voltas que o carrinho já deu ou a velocidade máxima registrada!'
            }
        };

        blocklyOptions.forEach(option => {
            option.addEventListener('click', () => {
                const optName = option.getAttribute('data-option');
                const info = categoryInfo[optName] || { icon: '<i class="bi bi-gear-wide-connected text-secondary"></i>', text: 'Informações sobre este módulo em breve!' };
                
                modalTitle.innerHTML = `<span><i class="bi bi-plugin text-primary"></i> Módulo: ${optName}</span>`;
                if(modalIcon) modalIcon.innerHTML = info.icon;
                modalBody.innerHTML = `<p class="fs-5">${info.text}</p>`;
                
                bsModal.show();
            });
        });
    }
});
