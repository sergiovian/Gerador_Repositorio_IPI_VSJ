if(document.documentElement.dataset.page==='generate'){
  new MutationObserver(()=>{
    const form=document.querySelector('#gf');
    if(!form||document.querySelector('#liturgy-import'))return;

    form.closest('.card').insertAdjacentHTML('afterend',`<section class="card panel p-4 mt-4" id="liturgy-import">
      <div class="d-flex flex-wrap justify-content-between gap-3 align-items-center">
        <div><h2 class="h5 mb-1"><i class="bi bi-file-earmark-slides me-2"></i>Importar liturgia</h2><p class="text-secondary mb-0">Envie TXT, Word ou PowerPoint. Uma linha em branco cria uma nova página de projeção.</p></div>
        <label class="btn btn-outline-primary mb-0"><i class="bi bi-upload me-1"></i>Escolher arquivo<input id="liturgy-file" type="file" accept=".txt,.docx,.pptx" hidden></label>
      </div>
      <div id="liturgy-preview" class="mt-3"></div>
    </section>`);

    const preview=document.querySelector('#liturgy-preview');
    const titleOf=content=>String(content||'').split('\n').find(Boolean)?.trim().slice(0,80)||'Página sem título';
    const normalizePages=slides=>slides.flatMap(slide=>String(slide.content||'').split(/\n\s*\n+/).map(value=>value.trim()).filter(Boolean)).map((content,index)=>({position:index+1,title:titleOf(content),content}));
    const render=()=>{
      const pages=window.importedLiturgy||[];
      if(!pages.length){preview.innerHTML='';return}
      preview.innerHTML=`<div class="alert alert-success d-flex flex-wrap justify-content-between align-items-center gap-2"><span>${pages.length} página(s) pronta(s) para a projeção. Edite o texto; cada caixa é uma página.</span><button class="btn btn-sm btn-success" id="liturgy-add-page"><i class="bi bi-plus-lg"></i> Adicionar página</button></div>
      <div class="vstack gap-3">${pages.map((page,index)=>`<article class="border rounded-3 p-3 bg-light"><div class="d-flex justify-content-between align-items-center mb-2"><strong>Página ${index+1}</strong><button type="button" class="btn btn-sm btn-outline-danger liturgy-remove" data-index="${index}"><i class="bi bi-trash"></i> Remover</button></div><textarea class="form-control liturgy-page" data-index="${index}" rows="5" aria-label="Conteúdo da página ${index+1}">${UI.esc(page.content)}</textarea><small class="text-secondary d-block mt-2">Título: <span class="liturgy-title">${UI.esc(titleOf(page.content))}</span></small></article>`).join('')}</div>`;
      preview.querySelector('#liturgy-add-page').onclick=()=>{window.importedLiturgy.push({content:''});render();preview.querySelectorAll('.liturgy-page')[pages.length]?.focus()};
      preview.querySelectorAll('.liturgy-page').forEach(input=>input.oninput=event=>{const index=Number(event.currentTarget.dataset.index),content=event.currentTarget.value;window.importedLiturgy[index]={position:index+1,title:titleOf(content),content};event.currentTarget.closest('article').querySelector('.liturgy-title').textContent=titleOf(content)});
      preview.querySelectorAll('.liturgy-remove').forEach(button=>button.onclick=event=>{window.importedLiturgy.splice(Number(event.currentTarget.dataset.index),1);window.importedLiturgy.forEach((page,index)=>page.position=index+1);render()});
    };

    document.querySelector('#liturgy-file').onchange=async event=>{
      const file=event.target.files[0]; if(!file)return;
      preview.innerHTML='<div class="text-secondary">Lendo e separando as páginas…</div>';
      try{
        const formData=new FormData();formData.append('file',file);
        const response=await fetch('/api/liturgy/import/preview',{method:'POST',body:formData});
        const json=await response.json();
        if(!response.ok)throw new Error(json.error?.message||json.message||'Não foi possível importar a liturgia.');
        window.importedLiturgy=normalizePages(Array.isArray(json.data)?json.data:[]);
        if(!window.importedLiturgy.length)throw new Error('Nenhum texto foi encontrado no arquivo.');
        render();
      }catch(error){preview.innerHTML=`<div class="alert alert-danger mb-0">${UI.esc(error.message)}</div>`}
    };
  }).observe(document.documentElement,{childList:true,subtree:true});
}
