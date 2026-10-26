"use strict";
const API="https://flevopay-api.lcfferr57.workers.dev";
const catalog=Object.freeze({1200:19.90,1700:24.90,2100:35.90,3600:42.90,4500:59.90,7000:89.90,10000:119.90});
const $=id=>document.getElementById(id), money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const params=new URLSearchParams(location.search), requested=params.get('product');
if(Object.hasOwn(catalog,requested))$('product').value=requested;
let quantity=Math.max(1,Math.min(20,Number.parseInt(params.get('qty')||'1',10)||1));window.kingdomQty=quantity;window.kingdomSetQty=function(n){quantity=Math.max(1,Math.min(20,n));window.kingdomQty=quantity;refresh();};function refresh(){const amount=catalog[$('product').value]*quantity;$('price').textContent=money(amount);$('subtotal').textContent=money(amount);$('item-price').textContent=money(amount);$('qty-value').textContent=quantity;$('product-count').textContent=quantity;} $('product').addEventListener('change',refresh);refresh();
let payment=null,timer=null,countdown=null;function startCountdown(){clearInterval(countdown);const deadline=Date.now()+300000;const update=()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));const el=$('pix-timer');if(el)el.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(!left){clearInterval(countdown);countdown=null;const msg=$('pix-expired');if(msg)msg.hidden=false;}};update();countdown=setInterval(update,1000);}function err(m){$('error').textContent=m;}
$('pay').addEventListener('click',async()=>{
 const username=$('username').value.trim(),email=$('email').value.trim(),product=$('product').value;
 if(!username){err('Informe seu usuário Roblox.');return;}
 if(!email||!$('email').checkValidity()){err('Informe um e-mail válido para gerar o Pix.');$('email').focus();return;}
 const amount=Number((catalog[product]*quantity).toFixed(2));if(!amount)return;
 $('pay').disabled=true;err('');
 try{const res=await fetch(API+'/api/create-pix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,username,amount,product:product+' Robux x'+quantity,quantity,source:'kingdom-robux-new'})});
 const data=await res.json();if(!res.ok||data.success===false)throw Error(data.message||'Falha ao gerar Pix');
 const id=String(data.paymentId||data.reference||data.transactionId||''),code=String(data.copyPaste||data.pixCode||''),base64=String(data.qrCodeBase64||data.qr_code_base64||''),qr=String(data.qrcodeUrl||data.qrCodeUrl||(base64?(base64.startsWith('data:image/')?base64:'data:image/png;base64,'+base64):''));
 if(!id||(!code&&!qr))throw Error('Resposta Pix incompleta do servidor');
 payment={id,code,qr,amount,email,username};if($('pix-expired'))$('pix-expired').hidden=true;startCountdown();$('details').hidden=true;$('pix').style.display='block';$('code').textContent=code||'Use o QR Code';
 if(qr&&/^(data:image\/|https:\/\/)/.test(qr)){$('qr').src=qr;$('qr').hidden=false;}else $('qr').hidden=true;const local=$('qr-local');if(local){local.replaceChildren();local.style.display='none';if(code&&typeof QRCode!=='undefined'){try{new QRCode(local,{text:code,width:220,height:220,correctLevel:QRCode.CorrectLevel.L});local.style.display='flex';$('qr').hidden=true;}catch(qrError){console.warn('QR local indisponível',qrError);}}if(code&&local.style.display==='none'){const img=document.createElement('img');img.alt='QR Code Pix';img.width=220;img.height=220;img.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='+encodeURIComponent(code);local.appendChild(img);local.style.display='flex';}}
 $('status').textContent='Aguardando confirmação do pagamento...';timer=setInterval(check,4000);check();
 }catch(e){err(e.message||'Erro de conexão com o servidor Pix.');}finally{$('pay').disabled=false;}
});
async function check(){if(!payment)return;try{const res=await fetch(API+'/api/status-pix?paymentId='+encodeURIComponent(payment.id),{cache:'no-store'});if(!res.ok)return;const data=await res.json();const status=String(data.status||data.paymentStatus||data.payment_status||data.state||'').toUpperCase();if(data.paid===true||['APPROVED','PAID','COMPLETED','CONFIRMED','SUCCESS','SUCCEEDED'].includes(status)){clearInterval(timer);timer=null;clearInterval(countdown);countdown=null;$('status').textContent='✅ Pagamento confirmado!';$('back').hidden=true;sessionStorage.setItem('kingdom_upsell_eligible',JSON.stringify({paymentId:payment.id,email:payment.email,username:payment.username,confirmedAt:Date.now()}));location.assign('./upsell.html');}}catch(e){console.warn('Falha temporária ao consultar Pix',e);}}
$('copy').addEventListener('click',async()=>{if(!payment?.code)return;try{await navigator.clipboard.writeText(payment.code);$('copy').textContent='Copiado!';}catch(e){err('Não foi possível copiar automaticamente. Selecione o código acima.');}});
$('back').addEventListener('click',()=>{clearInterval(timer);timer=null;clearInterval(countdown);countdown=null;payment=null;$('pix').style.display='none';$('details').hidden=false;});
