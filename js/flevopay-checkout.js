"use strict";
const API="https://flevopay-api.lcfferr57.workers.dev";
const catalog=Object.freeze({1200:19.90,1700:24.90,2100:35.90,3600:42.90,4500:59.90,7000:89.90,10000:119.90});
const $=id=>document.getElementById(id), money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const params=new URLSearchParams(location.search), requested=params.get('product');
if(Object.hasOwn(catalog,requested))$('product').value=requested;
let quantity=Math.max(1,Math.min(20,Number.parseInt(params.get('qty')||'1',10)||1));window.kingdomQty=quantity;window.kingdomSetQty=function(n){quantity=Math.max(1,Math.min(20,n));window.kingdomQty=quantity;refresh();};function refresh(){const amount=catalog[$('product').value]*quantity;$('price').textContent=money(amount);$('subtotal').textContent=money(amount);$('item-price').textContent=money(amount);$('qty-value').textContent=quantity;$('product-count').textContent=quantity;} $('product').addEventListener('change',refresh);refresh();
let payment=null,timer=null;function err(m){$('error').textContent=m;}
$('pay').addEventListener('click',async()=>{
 const username=$('username').value.trim(),email=$('email').value.trim(),product=$('product').value;
 if(!username){err('Informe seu usuário Roblox.');return;}
 if(email&&!$('email').checkValidity()){err('Informe um e-mail válido ou deixe o campo vazio.');return;}
 const amount=Number((catalog[product]*quantity).toFixed(2));if(!amount)return;
 $('pay').disabled=true;err('');
 try{const res=await fetch(API+'/api/create-pix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,username,amount,product:product+' Robux x'+quantity,quantity,source:'kingdom-robux-new'})});
 const data=await res.json();if(!res.ok||data.success===false)throw Error(data.message||'Falha ao gerar Pix');
 const id=String(data.paymentId||data.reference||data.transactionId||''),code=String(data.copyPaste||data.pixCode||''),qr=String(data.qrcodeUrl||data.qrCodeUrl||'');
 if(!id||(!code&&!qr))throw Error('Resposta Pix incompleta do servidor');
 payment={id,code,qr,amount};$('details').hidden=true;$('pix').style.display='block';$('pixprice').textContent=money(amount);$('code').textContent=code||'Use o QR Code';
 if(qr&&/^(data:image\/|https:\/\/)/.test(qr)){$('qr').src=qr;$('qr').hidden=false;}else $('qr').hidden=true;
 $('status').textContent='Aguardando confirmação do pagamento...';timer=setInterval(check,4000);check();
 }catch(e){err(e.message||'Erro de conexão com o servidor Pix.');}finally{$('pay').disabled=false;}
});
async function check(){if(!payment)return;try{const res=await fetch(API+'/api/status-pix?paymentId='+encodeURIComponent(payment.id),{cache:'no-store'});if(!res.ok)return;const data=await res.json();const status=String(data.status||data.paymentStatus||data.payment_status||data.state||'').toUpperCase();if(data.paid===true||['APPROVED','PAID','COMPLETED','CONFIRMED','SUCCESS','SUCCEEDED'].includes(status)){clearInterval(timer);timer=null;$('status').textContent='✅ Pagamento confirmado!';$('back').hidden=true;}}catch(e){console.warn('Falha temporária ao consultar Pix',e);}}
$('copy').addEventListener('click',async()=>{if(!payment?.code)return;try{await navigator.clipboard.writeText(payment.code);$('copy').textContent='Copiado!';}catch(e){err('Não foi possível copiar automaticamente. Selecione o código acima.');}});
$('back').addEventListener('click',()=>{clearInterval(timer);timer=null;payment=null;$('pix').style.display='none';$('details').hidden=false;});
