//
// adminToolsMain.js (Admin Tools Main javascript)
//

// ■□■□■□■□ Global constants □■□■□■□■
const BASE_ELEM_IDS = ['EXPT', 'header', 'loginForm', 'buttons', 'main', 'footer', 'report']

const QUERY_PATH = './includes/adminToolsQuery' + version + '.php'

const PRINT_HTML_PATH = 'print/printHtml' + version + '.php'


// ■□■□■□■□ Global variables □■□■□■□■
let gData//for debug.

// Object of basic elements.
let elems

let uid
let pw

// Arrays for the data obtained from DB
let types = []// array for the table `types`.
let events = []// array for the table `events`.
let registrations = []// array for the table `registrations`.
let reservationsRelated = []// array for the view `view_reservations_related`.
let messages = []// array for the table `messages`.

// The sorted 'events' in ascending order.
let ascEvents = []


// declare the object (indexed by typ names) of arrays of fyears.
// i.e, {'aa': [2020, ...], 'wk': [2017, 2018, ...], 'bc': [2017, 2018, ...], ...}
const fYears = {}

// Object (indexed by eid) of instances of EvtResvRel-object.
const evtResvRels = {}


//const typName = {aa: '入園出願予約', pr: 'プレ幼稚園予約', wk: 'わくわくキッズ', bc: 'ベビーＣＬＵＢ', er: '絵本ルーム', op: 'にこにこ広場', be: 'ベビーＣＬＵＢイベント', ce: '保育体験'}


const msgField = {afrom: 'From', ato: 'To', cc: 'Cc', bcc: 'Bcc', subject: 'Subject', body: 'Body'}


// Children indexed by emails.
let children = {}


// "dataUrls" is data for portraits.
let dataUrls = {}


// Window objects for AdmApps and BenfCertApps (both are needed to close)
let aAWin
let bCAWin


// "usrPwPln" is for the spoofing login by administrators which is gotten from the response of Fetch.
let usrPwPln





// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□■□■□ Functions □■□■□■□■□■□■□■

// get Fiscal year (i.e, from April to March) from string yyyy-mm-dd.
const getFyear = (strDatetime) => {
	const dt = new Date(strDatetime)
	// Remark that 'April' is the 3rd month.(for January is 0th.)
	return dt.getMonth() < 3? dt.getFullYear() - 1: dt.getFullYear()
}



// Get his or her "School Birthyear" from the birthdate. Those born between April 2 and April 1 of the following year will have the same schBirthYear. Those with the same schBirthYear have the same age as of April 1 of each year.
// Here "birth" is assumed to hava the format "yyyy-mm-dd HH:NMM:SS".
const schBirthYear = (birth) => {
	return +birth.slice(0, 4) + ((+birth.slice(5, 7) < 4 || birth.slice(5, 10) === '04-01')? -1: 0)
}





// ■□■□■□■□■□■□■□■□■□■□■□■□■□
// ■□■□■□■□ Do Fetch □■□■□■□■

// doFetch
// "opt" is an object of optional parameters. e.g, opt = {cid: ..., eid: ..., uid_cids: [...], msgDta: ...}
const doFetch = (phase, opt) => {
	let obj
	if(phase === 'login'){
		uid = (uid == null)? document.getElementById('uid').value : uid
		pw = (pw == null)? document.getElementById('pw').value: pw
		obj = {phase: phase, uid: uid, pw: pw}
	}else if(phase === 'getDataUrls'){
		obj = {phase: phase, uid: uid, pw: pw, uid_cids: opt.uid_cids}
	}else if(phase === 'updateChecks'){
		const checks = {participate: getChecks(opt.eid, 'participate'), sel: getChecks(opt.eid, 'sel')}
		obj = {phase: phase, uid: uid, pw: pw, checks: checks}
	}else if(phase === 'recordMessage'){
		obj = {phase: phase, uid: uid, pw: pw, msgData: opt.msgData}
	}else if(phase === 'insertMessage' || phase === 'updateMessage'){
		obj = {phase: phase, uid: uid, pw: pw, msgData: opt.msgData}
	}else if(phase === 'deleteMessage'){
		obj = {phase: phase, uid: uid, pw: pw, mid: opt.msgData.mid}
	}else if(phase === 'changeNursery'){
		obj = {phase: phase, uid: uid, pw: pw, eid: opt.eid, rid: opt.rid, cid: opt.cid, nursery: opt.nursery}
	}
	// prepare options.
	const body = JSON.stringify(obj)
	const options = {
		method: 'POST',
		headers: {
			'Accept': 'applitypion/json',
			'Content-Type': 'applitypion/json'
		},
		body: body,
	}
	// ajax by fetch
	const url = QUERY_PATH
	fetch(url, options)
	.then(response => response.json())
	.then(data => {
		gData = data//for debug
		if(phase === 'login'){
			types = data.types
			events = data.events
			reservationsRelated = data.reservationsRelated
			messages = data.messages
			registrations = data.registrations
			// for siblings
			children = getChildrenIndexedByUid(registrations)
			elems.loginForm.innerHTML = ''
			elems.buttons.innerHTML = ''
			main()
		}else if(phase === 'getDataUrls'){
			dataUrls[opt.eid] = data.dataUrls
			for(uid_cid of opt.uid_cids){
				if(dataUrls[opt.eid][uid_cid]){
					document.getElementById(`pr_${uid_cid}`).src = dataUrls[opt.eid][uid_cid]
				}
			}
		}else if(phase === 'updateChecks'){
			if(data.report === 'updated'){
				registrations = data.registrations
				reservationsRelated = data.reservationsRelated
				alert('［' + opt.eid + '］チェックボックスの変更を保存しました！')
				console.log('checks(pastpt and sel) of ' + opt.eid + ' has updated!')
			}
		}else if(phase === 'insertMessage' || phase === 'updateMessage'){
			if(data.report === 'inserted'){
				const elLab = document.getElementById(opt.mFormId).getElementsByTagName('label')[0]
				const labelText = elLab.innerHTML
				elLab.innerHTML = labelText.replace('（新規）', '')
				elLab.classList.remove('newMessage')
			}
			messages = data.messages
			alert('メッセージを保存しました！')
			console.log(`msg_${msgData.eid}_${msgData.mid} has ${data.report}!`)
		}else if(phase === 'deleteMessage'){
			if(data.report === 'deleted'){
				messages = data.messages
				alert('メッセージを削除しました！')
				console.log(`msg_${msgData.eid}_${msgData.mid} has ${data.report}!`)
				document.getElementById(opt.mFormId).remove()
			}
		}
		// For the spoofing login.
		usrPwPln = data.usrPwPln
		//console.log(data)
	})
	.catch((error) => {
		console.error('Error:', error)
	})
}



// create expand box
const createExpandBox = function(id, exClass, labelHtml){
	// It is supposed that some classes are given in the CSS. e.g, div.expandBox, input.expandCheck, .expandCheck:checked + .expandBox, and so on.
	// Create outer frame (root element).
	const elOut = document.createElement('div')
	elOut.id = id
	elOut.classList.add(exClass)
	// Create label element.
	const elLab = document.createElement('label')
	elLab.id = 'label_' + id
	// label always has class with the same name of elOut.id
	elLab.classList.add(id)
	elLab.innerHTML = labelHtml
	// 'for' property of the label
	const inputId = 'input_' + id
	elLab.htmlFor = inputId
	elOut.appendChild(elLab)
	// Create input element.
	const elInp = document.createElement('input')
	elInp.id = inputId
	elInp.setAttribute('type', 'checkbox')
	// class 'expandCheck' must be defined in css.
	elInp.classList.add('expandCheck')
	elOut.appendChild(elInp)
	// internal box(expand-collapse part)
	const elIn = document.createElement('div')
	elIn.id = 'in_' + id
	// class 'expandBox' must be defined in css.
	elIn.classList.add('expandBox')
	elOut.appendChild(elIn)
	// return
	return elOut
}



// Constructors (Classes) and Methods ・・・

const Type = function(key, name){
	this.key = key
	this.name = name
}


Type.prototype.display = function(parEl){
	const expandBox = createExpandBox(this.key, 'type', '◆' + this.name)
	parEl.appendChild(expandBox)
	document.getElementById('input_' + this.key).checked = true
}


const TypFYear = function(typ, fyear){
	this.typ = typ
	this.fyear = fyear
	this.id = typ + fyear
	//this.events =
}


TypFYear.prototype.display = function(){
	const expandBox = createExpandBox(this.id, 'typFYear', this.fyear + '年度')
	const parent = document.getElementById('in_' + this.typ)
	parent.insertBefore(expandBox, parent.firstChild)
}


// Events, reservations and related indexed by eid.
// The object is a constructor for event, but it will hold reservationsRelated data in much the same way.
const EvtResvRel = function(event){
	this.evt = event
	this.typfyear = event.typ + getFyear(event.edate)
	this.areChildrenAppended = false
	// resvRel: array of elements of reservationsRelated which eid equals to this.evt.eid
	this.resvRel = []
	this.sold = 0
	// msgs: array of Message objects which evt.eid equals to this.evt.eid
	this.msgs = []
}


EvtResvRel.prototype.display = function(){
	const buf = `<div class='eidEtitleSold colBg'>${this.evt.eid}&nbsp;&nbsp;${this.evt.etitle}（${this.sold}/${((+this.evt.capacity > 0)? this.evt.capacity: '定員未設定')}）</div>`
	const elExpBox = createExpandBox(this.evt.eid, 'event', buf)
	const elPar = document.getElementById('in_' + this.typfyear)
	elPar.insertBefore(elExpBox, elPar.firstChild)
	const elIn = document.getElementById('in_' + this.evt.eid)
	const idPrfx = ['parTblResvs', 'parMessages', 'parButtons', 'parExpt']
	for(let i = 0, len = idPrfx.length; i < len; i++){
		const el = document.createElement('div')
		el.id = idPrfx[i] + '_' + this.evt.eid
		elIn.appendChild(el)
	}
	// create children
	document.getElementById(this.evt.eid).addEventListener('change', function(){
		const evtResvRel = evtResvRels[this.id]
		if(!evtResvRel.areChildrenAppended){
			// createTblResvs returns an object {elem: ..., uid_cids: ...}
			const tblResvs = evtResvRel.createTblResvs()
			// Create Resvs table. We use the one element of tblResvs (.elem).
			document.getElementById('parTblResvs_' + this.id).appendChild(tblResvs.elem)
			// Add eventListeners to CN buttons of the table.
			if(evtResvRel.evt.typ === 'aa' && evtResvRel.evt.apr1age === 2){
				for(let i = 0, len = evtResvRel.resvRel.length; i < len; i++){
					document.getElementById(`btnChNurs_${evtResvRel.resvRel[i].rid}`).addEventListener('click', function(e){
						const rR = JSON.parse(e.currentTarget.dataset.rR)
						if(confirm(`${rR.clname}${rR.cfname}さまの給付認定区分を${rR.nursery? '3号から1号へ': '1号から3号へ'}変更してよろしいですか？`)){
							doFetch('changeNursery', rR)
						}
					}, false)
				}
			}

			// create messsage forms.
			for(let i = 0, len = evtResvRel.msgs.length; i < len; i++){
				document.getElementById('parMessages_' + this.id).appendChild(evtResvRel.msgs[i].createForm())
			}

			// make heights of textarea's variable.
			//makeTextareaHeightVariable()

			// button to create a new message.
			/*
			const btnNewMessage = document.createElement('button')//button to create a new message
			btnNewMessage.classList.add('btnFull', 'newMessage')
			btnNewMessage.addEventListener('click', function(){
				const elEvent = this.closest('.event')
				const message = new Message({eid: elEvent.id})
				document.getElementById('parMessages_' + elEvent.id).appendChild(message.createForm())
			}, false)
			btnNewMessage.innerHTML = '新規メッセージ'
			document.getElementById('parButtons_' + this.id).appendChild(btnNewMessage)
			*/

			// Set the button to get BCC LIST.
			const btnDspDestList = document.createElement('button')
			btnDspDestList.dataset.eid = this.id
			btnDspDestList.classList.add('btnFull', 'dspDestList')
			btnDspDestList.addEventListener('click', function(e){
				const eid = e.currentTarget.dataset.eid
				let htEmails = `<span >メールアドレス</span><br>`
				let htEmailsNames = `<span class='bold font12'>メールアドレス，氏名</span><br>`
				let checked = {email: '', emailName: ''}
				let unChecked = {email: '', emailName: ''}
				for(let i = 0, len = evtResvRels[eid].resvRel.length; i < len; i++){
					const rR = evtResvRels[eid].resvRel[i]
					if(document.getElementById(`sel${rR.rid}`).checked){
						checked.email += `${rR.email}<br>`
						checked.emailName += `${rR.email},${rR.clname}&nbsp;${rR.cfname}&nbsp;様<br>`
					}else{
						unChecked.email += `${rR.email}<br>`
						unChecked.emailName += `${rR.email},${rR.clname}&nbsp;${rR.cfname}&nbsp;様<br>`
					}
				}
				// Delete "<br>" at the end of each string.
				checked.email = checked.email.replace(/<br>$/, '')
				checked.emailName = checked.emailName.replace(/<br>$/, '')
				unChecked.email = unChecked.email.replace(/<br>$/, '')
				unChecked.emailName = unChecked.emailName.replace(/<br>$/, '')
				// Getting the parent element.
				const elParExpt = document.getElementById(`parExpt_${eid}`)
				elParExpt.classList.add('dest')
				// Create contents.
				const htEmailsEtc = `<table>
					<colgroup><col class='rowTitle'><col class='email'><col class='emailName'></colgroup>
					<tr>
						<th></th><th>メールアドレス</th><th>メールアドレス，氏名</th>
					</tr>
					<tr>
						<td class='rowTitle'>■Bcc</span></td>
						<td>${checked.email}</td>
						<td>${checked.emailName}</td>
					</tr>
					<tr>
						<td class='rowTitle'>□Bcc</td>
						<td>${unChecked.email}</td>
						<td>${unChecked.emailName}</td>
					</tr>
				</table>`
				// Put the contents.
				elParExpt.innerHTML = htEmailsEtc
			}, false)
			btnDspDestList.innerHTML = '✔︎Sel メールアドレス，子ども氏名　抽出'
			document.getElementById(`parButtons_${this.id}`).appendChild(btnDspDestList)

			// Create buttons for the applications of admission and Benefit Certification.
			if(evtResvRel.evt.typ === 'aa'){
				// For printing AdmApps (Admission Applications).
				const htBtnPrtAdmApps = `<div class='btnFull prtAdmApps' data-eid='${this.id}'>
					<div id='btnAdmApps_${this.id}' class='pressArea'>✔︎Sel 入園願書　印刷</div>
					<div class='prtParam'>
						Offsets: X&nbsp;<input type='text' value='${offsetX}'>px,&nbsp; Y&nbsp;<input type='text' value='${offsetY}'>px,&nbsp;&nbsp;&nbsp;
						Scales: X&nbsp;<input type='text' value='${scaleX}'>,&nbsp; Y&nbsp;<input type='text' value='${scaleY}'>
					</div>
				</div>`
				document.getElementById(`parButtons_${this.id}`).insertAdjacentHTML('beforeend', htBtnPrtAdmApps)
				document.getElementById(`btnAdmApps_${this.id}`).addEventListener('click', function(e){
					// Prepare the message (object) to post.
					const msg = {}
					// purpose ("adm" or "benfCert")
					msg.purpose = 'adm'
					const elPar = e.currentTarget.parentElement
					const eid = elPar.dataset.eid
					// dataUrls (especially for "adm")
					msg.dataUrls = dataUrls[eid]
					// resvRel's (data)
					const chk = getChecks(eid, 'sel')
					msg.resvRel = evtResvRels[eid].resvRel.filter(v => chk[v.rid])
					// Parameters for printing.
					const inp = elPar.querySelectorAll('input')
					msg.prt = {offsetX: inp[0].value, offsetY: inp[1].value, scaleX: inp[2].value, scaleY: inp[3].value}
					const wl = window.location// for shortening.
					if(!aAWin || aAWin.closed){
						aAWin = window.open(wl.origin + wl.pathname.replace(/\/[^\/]*$/, '\/') + PRINT_HTML_PATH + wl.search)
						aAWin.onload = () => aAWin.postMessage(msg, window.location.origin)
					}else{
						aAWin.postMessage(msg, window.location.origin)
						aAWin.focus()
					}
				}, false)

				// For printing BenfCertApps (Benefit Certification Applications).
				const htBtnPrtBenfCertApps = `<div class='btnFull prtBenfCertApps' data-eid='${this.id}'>
					<div id='btnBenfCertApps_${this.id}' class='pressArea'>✔︎Sel 給付認定申請書　印刷</div>
					<div class='prtParam'>
						Offsets: X&nbsp;<input type='text' value='${offsetX}'>px,&nbsp; Y&nbsp;<input type='text' value='${offsetY}'>px,&nbsp;&nbsp;&nbsp;
						Scales: X&nbsp;<input type='text' value='${scaleX}'>,&nbsp; Y&nbsp;<input type='text' value='${scaleY}'>
					</div>
				</div>`
				document.getElementById(`parButtons_${this.id}`).insertAdjacentHTML('beforeend', htBtnPrtBenfCertApps)
				document.getElementById(`btnBenfCertApps_${this.id}`).addEventListener('click', function(e){
					// Prepare the message (object) to post.
					const msg = {}
					// purpose ("adm" or "benfCert")
					msg.purpose = 'benfCert'
					const elPar = e.currentTarget.parentElement
					const eid = elPar.dataset.eid
					// resvRel's (data)
					const chk = getChecks(eid, 'sel')
					msg.resvRel = evtResvRels[eid].resvRel.filter(v => chk[v.rid])
					// Parameters for printing.
					const inp = elPar.querySelectorAll('input')
					msg.prt = {offsetX: inp[0].value, offsetY: inp[1].value, scaleX: inp[2].value, scaleY: inp[3].value}
					const wl = window.location// for shortening.
					if(!bCAWin || bCAWin.closed){
						bCAWin = window.open(wl.origin + wl.pathname.replace(/\/[^\/]*$/, '\/') + PRINT_HTML_PATH + wl.search)
						bCAWin.onload = () => bCAWin.postMessage(msg, window.location.origin)
					}else{
						bCAWin.postMessage(msg, window.location.origin)
						bCAWin.focus()
					}
				}, false)
			}

			// for each evtResvRel, we append the children (i.e, Resvs-table and message-forms) just once.
			evtResvRel.areChildrenAppended = true

			// Download the portraits of bookers for this event and display them. We use the another element of tblResvs (.uid_cids).
			if(!(this.id in dataUrls)){
				doFetch('getDataUrls', {uid_cids: tblResvs.uid_cids})
			}
		}
	}, false)
}


EvtResvRel.prototype.createTblResvs = function(){
	const typ = this.evt.typ// for shortening.
	const jaCsex = {'m': '男', 'f': '女'}
	const elOut = document.createElement('div')
	elOut.id = 'tblResvs_' + this.evt.eid
	elOut.classList.add('tblResvs')
	const elTable = document.createElement('table')
	elOut.appendChild(elTable)
	const elThead = document.createElement('thead')
	elTable.appendChild(elThead)
	const headerRow = elThead.insertRow(-1)
	// ver.011 では questuion は廃止。
	const thContents = [
		"N",
		"RID<br>[CID]<br><span class='bold'>PL</span>",
		"子ども しめい（氏名）<br>P: 利用者氏名",
		"生年月日<br>[性別]",
		`${typ === 'aa'? '家族構成<br>しめい（氏名）［続柄, B: 生年月日, Hoh: 世帯主, Ph: 電話番号, 在卒園 or Smile］': '兄弟姉妹'}`,
		"現住所, etc.<br>電話番号(CCS利用)",
		'参加<br>経験',
		`${typ === 'aa'? 'ENT: 入園希望日<br>EC: EC希望<br>連絡等': (typ === 'pr'? '購入品・連絡等': 'コメント・質問など')}`,
		`${(typ === 'aa')? "出願": ((typ === 'pr')? "入会": "出欠")}<br><input type='checkbox' onClick='checkAll(this, "${this.evt.eid}", "participate");'>`,
		`EMAIL<br>[UID]`,
		`Sel<br><input type='checkbox' onClick='checkAll(this, "${this.evt.eid}", "sel");'>`
	]
	// When the event is aa type and the target age is 2 (i.e. 2歳児 or 満3歳児)，the "ChangeEvent" buttons are added.
	if(this.evt.typ === 'aa' && this.evt.apr1age === 2){
		thContents.splice(1, 0, ["<div class='btnChNurs'>号<br>変</div>"])
	}
	headerRow.innerHTML = thContents.reduce((a, v) => (a += `<th>${v}</th>`, a), '')
	const elTbody = document.createElement('tbody')
	elTable.appendChild(elTbody)
	this.resvRel.sort((x, y) => {return (x.rid > y.rid)? 1: -1})
	const rows = []
	let dCell

	// "uid_cids" is the keys of dataUrls for one download.
	let uid_cids = []

	// Common part (directory) of href for the spoofing login.
	const hrefDir = `${location.origin}${location.pathname.replace(/\/[^\/]*$/, '')}`

	for(let i = 0, len = this.resvRel.length; i < len; i++){
		let priority = false
		const rR = this.resvRel[i]// for shortening.
		rows[i] = elTbody.insertRow(-1)
		// "plusCls" (Plus Class) is there to distinguish waitings from reservations.
		let plusCls = 'resv'
		if(+this.evt.capacity){// When the capacity is set:
			if(+this.evt.dedupe){
				//plusCls = // "dedupe" is not yet supported!
			}else{
				plusCls = +this.evt.capacity <= i? 'wtng': plusCls
			}
		}
		// Receipt Number = "erid" (starting from 1)
		addCellToRow(rows[i], -1, ['center', plusCls], i + 1)

		// When the event is 'aa' type and the target age is 2 (i.e. event for 2歳児 or 満3歳児)，the buttons for "changeNursery" (0 → 1, 1 → 0) are added.
		if(this.evt.typ === 'aa' && this.evt.apr1age === 2){
			// Put a button for changing nursery (actually a change of eid).
			// the "rR" is set to the "dataset" as JSON sstring.
			addCellToRow(rows[i], -1, ['center', plusCls], `<div id='btnChNurs_${rR.rid}' data-r-r='${JSON.stringify(rR)}' class='btnChNurs'>CN</div>`)
			// Teh "eventListener" will be added after the table is rendered.
		}

		// RID (rid in `reservations`), [cid] and PL(ProxyLogin) button.
		addCellToRow(rows[i], -1, ['center', 'font08', plusCls], `<div id='rid_${rR.rid}'>${rR.rid}<br>[${rR.cid}]<br><a href='${hrefDir}/?uid=${rR.uid}&pw=${usrPwPln}&typs=${rR.typ}' target='_blank'><span class='bold'>PL</span></a></div><div style='font-weight: bold;'>${plusCls === 'wtng'? `Waiting<br>(${i - this.evt.capacity + 1})`: ''}</div>`)
		// Child name, parent name and child portrait.
		// "uid_cid" is used as the key for the portrait image.
		const uid_cid = `${rR.uid}_${rR.cid}`
		uid_cids.push(uid_cid)
		const namesPortrait = `<div class='flexWrapFsSb'>
			<div class='bold'>${rR.clname_k} ${rR.cfname_k}<br>（${rR.clname} ${rR.cfname}）<br><span class='font08'>P：${rR.ulname} ${rR.ufname}</span></div>
			${typ === 'aa'? `<div class='parImg'><img id='pr_${uid_cid}' class='thumbPortrait'></div>`: ''}
		</div>`
		addCellToRow(rows[i], -1, 'left', namesPortrait)
		// cbirth and csex
		addCellToRow(rows[i], -1, 'center', `${rR.cbirth.slice(0,10)}<br>[${jaCsex[rR.csex]}]`)
		// famMembers or siblings
		if(typ === 'aa'){
			let htFamMembers = ''
			// requiring rR.fam_members is not null
			if(!rR.fam_members){
				htFamMembers = 'famMembers is NULL'
			}else{
				for(let j = 0, len = rR.fam_members.length; j < len; j++){
					const fm = rR.fam_members[j]
					let fmClass = ''
					if((+rR.cid === +fm.cid && +fm.fmSmile) || (fm.fmRs === 'sib' &&  fm.fmBirth < rR.cbirth.slice(0,10) && (+fm.fmEnroll || +fm.fmGrad))){
						priority = true
						fmClass = 'priority'
					}
					htFamMembers += `<div class='${fmClass}'>${fm.fmLname_k}&nbsp;${fm.fmFname_k}（${fm.fmLname}&nbsp;${fm.fmFname}）［${getRsStr(fm.fmBirth, fm.fmSex, fm.fmRs, rR.cbirth)}, B ${fm.fmBirth}, ${+fm.fmHoh? 'Hoh, ': ''}${fm.fmPhone? `Ph ${fm.fmPhone}`: ''}${+fm.fmSmile? ', Smile':''}${+fm.fmEnroll? ', 在園': ''}${+fm.fmGrad? ', 卒園': ''}］</div>`
				}
			}
			addCellToRow(rows[i], -1, ['left', 'font09'], htFamMembers)
		}else{
			const siblings = children[rR.uid]
			const arrSiblings = []
			for(let j = 0; j < siblings.length; j++){
				if(siblings[j].cid !== rR.cid){
					arrSiblings.push(`<div>${siblings[j].clname_k} ${siblings[j].cfname_k}（${jaCsex[siblings[j].csex]}）${siblings[j].cbirth.slice(0, 10)}生</div>`)
				}
			}
			addCellToRow(rows[i], -1, ['left', 'font08'], arrSiblings.join(''))
		}
		// Address and plusPart(famRel(aa) or phones)
		let htAddressPlus = `${rR.zipcode} ${rR.cityarea}${rR.street}${rR.building !== null? rR.building: ''}`
		if(typ === 'aa'){
			if(rR.fam_rel){
				const fr = rR.fam_rel
				htAddressPlus += `${+fr.frSglPar? '<br>★ひとり親世帯': ''}${+fr.frLivPro? `<br>◆生活保護適用［${fr.frLivProStart}〜］`: ''}`
			}else{
				htAddressPlus += 'famRel is NULL'
			}
		}else{
			htAddressPlus += `<br>${rR.uphone}${rR.hphone? `<br>${rR.hphone}`: ''}`
		}
		addCellToRow(rows[i], -1, ['left', 'wdLtd10rem'], htAddressPlus)
		// Past particpated.
		const arrPastPt = []
		for(let j = 0, len = rR.pastpt.length; j < len; j++){
			arrPastPt.push(rR.pastpt[j])
		}
		const strArrPastPt = (arrPastPt.length > 3)? `${arrPastPt.slice(0,3)}<br>${arrPastPt.slice(3,)}`: arrPastPt
		addCellToRow(rows[i], -1, ['center', 'wdLtd2rem'], strArrPastPt)
		// ENTDATE, EngCourse Hope (if yes) and comments.
		dCell = rows[i].insertCell(-1)
		dCell.classList.add('wsPreWrap', 'comment', 'wdLtd10rem')
		dCell.innerHTML = ''
		if(typ === 'aa'){
			const ed = rR.entdate? rR.entdate.replace(/\s\d{2}:\d{2}:\d{2}/, ''): ''
			const ec = +rR.eng_course? `EC ${schBirthYear(rR.cbirth) + 5}年度<br>`: ''
			dCell.innerHTML += `ENT ${ed}<br>${ec}<br>`
		}
		dCell.innerHTML += rR.comment !== null? rR.comment: ''
		// Checkbox for Participatiton (or Enroll Application).
		dCell = rows[i].insertCell(-1)
		dCell.classList.add('center')
		const inputParticipate = document.createElement('input')
		inputParticipate.id = 'participate' + rR.rid
		inputParticipate.setAttribute('type', 'checkbox')
		inputParticipate.classList.add('participate')
		dCell.appendChild(inputParticipate)
		inputParticipate.checked = (rR.participate === 1)
		// EMAIL and UID
		addCellToRow(rows[i], -1, 'left', `<div style='margin-bottom: 10px;'>${rR.email}</div><div>[${rR.uid}]</div>`)
		// Checkbox for Bcc (or Print) Selection.
		dCell = rows[i].insertCell(-1)
		dCell.classList.add('center')
		const inputSel = document.createElement('input')
		inputSel.id = 'sel' + rR.rid
		inputSel.setAttribute('type', 'checkbox')
		inputSel.classList.add('sel')
		dCell.appendChild(inputSel)
		inputSel.checked = (rR.sel === 1)
	}
	// tfoot(for 'updateChecks' button)
	const elTfoot = document.createElement('tfoot')
	elTable.appendChild(elTfoot)
	const footerRow = elTfoot.insertRow(-1)
	const fCell = footerRow.insertCell(-1)
	fCell.id = this.evt.eid
	fCell.colSpan = headerRow.querySelectorAll('th').length
	fCell.innerHTML = 'チェックボックスの変更を保存'
	fCell.addEventListener('click', function(){
		doFetch('updateChecks', {eid: this.id})
	}, false)
	const elCap = elTable.createCaption()
	elCap.classList.add('right', 'font09')
	elCap.innerHTML = `<div style='display: flex; justify-content: space-between; align-items: flex-end;'>
		<div style='font-weight: bold; font-size: 1.2rem;'>［${this.evt.eid}］${this.evt.etitle}（${this.sold}/${((+this.evt.capacity > 0)? this.evt.capacity: '定員未設定')}）</div>
		<div style='width: 16rem; font-size: 0.8rem'>［参加経験］wk: わくわくキッズ，bc: ベビーCLUB，er: 絵本ルーム，op: にこにこ広場，be: ベビーCLUBイベント，ce: 保育体験</div>
	</div>`
	return {elem: elOut, uid_cids: uid_cids}
}


// "addCellToRow" is for EvtResvRel.prototype.createTblResvs.
const addCellToRow = function(rowElement, index, cellClass, cellHtml){
	const cell = rowElement.insertCell(index)
	if(Array.isArray(cellClass)){
		for(let i = 0; i < cellClass.length; i++){
			cell.classList.add(cellClass[i])
		}
	}else{
		cell.classList.add(cellClass)
	}
	cell.innerHTML = cellHtml
}


const checkAll = function(obj, eid, inputClass){
	const inputCheck = obj.closest('#tblResvs_' + eid).querySelectorAll('input.' + inputClass)
	for(let i = 0, len = inputCheck.length; i < len; i++){
		inputCheck[i].checked = obj.checked
	}
}





// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□
// ■□■□■□■□■□■□ "getSibRsStr", "getRsStr", etc. from CCS/js/main.js ■□■□■□■□■□■

// Get the string of sibling relation ('兄', '弟', '姉', '妹') from births and sexes.
// Each birth is assumed to have the form "yyyy-mm-dd( HH:MM:SS)". And "fmSex" takes 'f' or 'm'.
// Remember that JS Date() works in a strange? way. In fact, for example, new Date('2024-01-01') and new Date('2024-01-01 00:00:00') give different datetimes. Therefore, we dare to compare them not as datetimes but as strings with aligned formatting.
const getSibRsStr = (fmBirth, fmSex, tgtBirth) => {
	// Parsing the parameters.
	if(!fmBirth.match(/\d{4}-\d{2}-\d{2}/) || !tgtBirth.match(/\d{4}-\d{2}-\d{2}/) || ['f', 'm'].indexOf(fmSex) < 0) return false

	// Triming the ' H:M:S' part of the dates. And compare the results as strings.
	const trmFmB = fmBirth.replace(/\s\d{2}:\d{2}:\d{2}/, '')
	const trmTgtB = tgtBirth.replace(/\s\d{2}:\d{2}:\d{2}/, '')

	const dspMtx = [['妹', '姉'], ['弟', '兄']]
	return trmFmB === trmTgtB? '本人': dspMtx[['f', 'm'].indexOf(fmSex)][+(trmFmB < trmTgtB)]
}



// Get rs (relationship) string ('母', '父', ・・・) from the members properties and the target child birth. if fmRs === 'oths' (others), it return empty string.
const getRsStr = (fmBirth, fmSex, fmRs, tgtBirth) => {
	let rsStr = ''
	if(fmRs === 'sib'){
		rsStr = getSibRsStr(fmBirth, fmSex, tgtBirth)
	}else if(fmRs === 'par'){
		rsStr += fmSex === 'f'? '母': (fmSex === 'm'? '父': '')
	}else if(fmRs === 'gp'){
		rsStr += fmSex === 'f'? '祖母': (fmSex === 'm'? '祖父': '')
	}
	return rsStr
}

// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■





// get checks(participate, sel) to reserve in DB.
const getChecks = (eid, inputClass) => {
	const inputCheck = document.getElementById('tblResvs_' + eid).querySelectorAll('tbody input.' + inputClass)
	let checks = {}
	for(let i = 0, len = inputCheck.length; i < len; i++){
		checks[inputCheck[i].id.replace(inputClass, '')] = (inputCheck[i].checked)? 1: 0
	}
	return checks
}


// make array of children indexed by uid (to get siblings information).
const getChildrenIndexedByUid = (registrations) => {
	const regs = registrations// for shortening.
	let arr = {}
	for(let i = 0, len = regs.length; i < len; i++){
		if(arr[regs[i].uid] == null) arr[regs[i].uid] = []
		const value = {cid: regs[i].cid, clname_k: regs[i].clname_k, cfname_k: regs[i].cfname_k, csex: regs[i].csex, cbirth: regs[i].cbirth}
		arr[regs[i].uid].push(value)
	}
	return arr
}





// Message related is not used for now.
/*
const Message = function(msg){
	// i.e, {mid: msg.mid, eid: msg.eid, afrom: msg.afrom, ato: msg.ato, ...}
	// At least msg.eid must be defined.
	if(msg.eid !== undefined){
		this.evt = msg
		// If msg.mid is undefined(i.e, "new message"), then we determine it by Date().
		this.new = false
		if(msg.mid === undefined){
			this.new = true
			this.evt.mid = (new Date()).getTime()
			this.evt.ato = this.evt.afrom = 'kg-ccs@seikyo.ed.jp'
		}
		// Bcc must be updated to current 'resvRel'.
		this.evt.bcc = evtResvRels[msg.eid].resvRel.filter(rsv => rsv.bcc === '1').map(rsv => rsv.ulname + ' ' + rsv.ufname + '<' + rsv.email + '>').join(',')
	}
}


Message.prototype.createForm = function(){
	const labelHtml = "［" + this.evt.eid + "］予約者宛メッセージ " + ((this.new)? '（新規）': '') + "　　<span class='font07'> （mid: " + this.evt.mid + "）</span>"
	const mForm = createExpandBox(this.evt.mid, 'messageForm', labelHtml)
	const elIn = mForm.getElementsByClassName('expandBox')[0]
	// mForm.new and mForm.eid are necessary to record the message.
	mForm.new = this.new
	mForm.mid = this.evt.mid
	mForm.eid = this.evt.eid
	const elTable = document.createElement('table')
	elIn.appendChild(elTable)
	const elTbody = document.createElement('tbody')
	elTable.appendChild(elTbody)
	const rows = {}
	let dCell
	for(key in msgField){
		rows[key] = elTbody.insertRow(-1)
		dCell = rows[key].insertCell(-1)
		dCell.classList.add('fieldKey')
		dCell.innerHTML = msgField[key]
		dCell = rows[key].insertCell(-1)
		dCell.classList.add('fieldValue')
		const tarea = document.createElement('textarea')// textarea
		tarea.id = mForm.mid + '_' + key
		tarea.name = key
		tarea.rows = (key === 'body')? 5: 1
		tarea.cols = 48
		tarea.classList.add(key)
		if(this.evt[key] !== undefined) tarea.innerHTML = this.evt[key]
		dCell.appendChild(tarea)
		if(key === 'bcc'){
			const btnRefreshBcc = document.createElement('div')
			btnRefreshBcc.classList.add('refreshBcc')
			btnRefreshBcc.innerHTML = 'Update Bcc to reserved.'
			btnRefreshBcc.addEventListener('click', function(){
				const mForm = this.closest('.messageForm')
				const currentBcc = evtResvRels[mForm.eid].resvRel.filter(rsv => rsv.bcc === '1').map(rsv => rsv.ulname + ' ' + rsv.ufname + '<' + rsv.email + '>').join(',')
				document.getElementById(mForm.mid + '_bcc').innerHTML = currentBcc
			}, false)
			dCell.appendChild(btnRefreshBcc)
		}
	}
	makeTextareaHeightVariable(elTbody)

	// button to delete this message & form.
	const elBtnDelMsg = document.createElement('div')
	elBtnDelMsg.classList.add('deleteMessage')
	elBtnDelMsg.addEventListener('click', function(){
		// get object 'msgData' with only the key 'mid'.
		const mForm = this.closest('.messageForm')
		const msgData = {'mid': mForm.mid}
		if(confirm('メッセージを削除してよろしいですか？')){
			if(mForm.new){//if it is new, then we only remove the message-form itself.
				document.getElementById('parMessages_' + mForm.eid).removeChild(mForm)
			}else{// if not new.
				doFetch('deleteMessage', mForm.eid, msgData, mForm.id)
			}
		}
	}, false)
	elBtnDelMsg.innerHTML = '×'
	const label = mForm.getElementsByClassName(this.evt.mid)[0]
	label.appendChild(elBtnDelMsg)

	// button to record message.
	const elBtnRecMsg = document.createElement('button')
	elBtnRecMsg.classList.add('btnFull', 'etc')
	elBtnRecMsg.addEventListener('click', function(){
		const mForm = this.closest('.messageForm')
		const msgData = {}
		msgData['mid'] = mForm.mid
		msgData['eid'] = mForm.eid
		const tareas = mForm.querySelectorAll('textarea')//'this' will be <button …></button>
		tareas.forEach(tarea => {
			msgData[tarea.name] = tarea.value
		})
		if(mForm.new){
			doFetch('insertMessage', mForm.eid, msgData, mForm.id)
		}else{
			doFetch('updateMessage', mForm.eid, msgData, mForm.id)
		}
	}, false)
	elBtnRecMsg.innerHTML = 'メッセージを保存'
	elIn.appendChild(elBtnRecMsg)

	// button to create 'mailto-Anchor' for 'Gmail-Compose'.
	// 急ぎ作成につき・・要再整理
	const elBtnCrtMailtoAnc = document.createElement('button')
	elBtnCrtMailtoAnc.classList.add('btnFull', 'toMailer')
	elBtnCrtMailtoAnc.addEventListener('click', function(){
		const mForm = this.closest('.messageForm')
		const msgData = {}
		const tareas = mForm.querySelectorAll('textarea')
		tareas.forEach(tarea => {
			msgData[tarea.name] = tarea.value
		})
		const ancText = "［" + mForm.eid + "］予約者宛メッセージ：（" + mForm.mid + "）　メーラー作成画面を開く"
		const wrapAnc = document.createElement('div')
		wrapAnc.innerHTML = createMailtoAnchor(msgData.ato, msgData.cc, msgData.bcc, msgData.subject, msgData.body, ancText)
		const elIn = mForm.getElementsByClassName('expandBox')[0]
		elIn.appendChild(wrapAnc)
	}, false)
	elBtnCrtMailtoAnc.innerHTML = 'メーラーの作成画面へ'
	elIn.appendChild(elBtnCrtMailtoAnc)

	return mForm
}


// make the height of textareas variable.
const adjustRows = function(tarea){
	// パラメータ rows 及びrowsプロパティを tarea.rows(未設定なら 1)で初期化
	let rows = (tarea.rows || 1); tarea.setAttribute('rows', rows)
	// tarea.scrollHeightで物理行的高さを取得
	while(tarea.offsetHeight < tarea.scrollHeight){
		tarea.setAttribute('rows', ++rows)
	}
}


const trimAndAdjustRows = function(tarea){
	// body以外では、空行を除去（文字列末尾の改行文字も除去）
	if(tarea.name !== 'body') tarea.value = tarea.value.replace(/^\n/gm, '').replace(/\n$/, '')
	// 以降は adjustRows そのまま（adjustRows()と書けないのは tarea を渡せないから…）
	let rows = 1; tarea.setAttribute('rows', rows)
	while(tarea.offsetHeight < tarea.scrollHeight){
		tarea.setAttribute('rows', ++rows)
	}
}


const makeTextareaHeightVariable = function(closestElement){
	const tareas = closestElement.querySelectorAll('textarea')
	tareas.forEach(tarea => {
		// 関数adjustRows等におけるthisはイベント発生元要素を指すので、この場合.bind(tarea)はなくともよい。
		tarea.addEventListener('focus', function(){adjustRows(this)}, false)
		tarea.addEventListener('input', function(){adjustRows(this)}, false)
		tarea.addEventListener('change', function(){trimAndAdjustRows(this)}, false)
	})
}


// Call Gmail Compose-Window.

// php's http_build_query in javascript
// it does not support object-type values.
// map: Map Object e.g, map = new map([['cc', 'c1@x.yz, c2@x.yz'], ['bcc', 'b1@x.yz,b2@x.yz,b3@x.yz'], ['subject', '例の件'], ['body', mBody]]) 但し mBody はテキストが代入された変数。
const jsHttpBuildQuery = (map) => {
	let strOut = []
	map.forEach((value, key) => {
		const encKey = encodeURIComponent(key.replace(/[!'()*']/g, escape))
		const encValue = encodeURIComponent(value.replace(/[!'()*']/g, escape))
		strOut.push(encKey + '=' + encValue)
	})
	return strOut.join('&')
}


const createMailtoAnchor = (_to, _cc, _bcc, _subject, _body, ancText) => {
	const map = new Map([['cc', _cc], ['bcc', _bcc], ['subject', _subject], ['body', _body]])
	const queryString = jsHttpBuildQuery(map)
	return "<a href='mailto:" + _to + "?" + queryString + "'>" + ancText + "</a>"
}
*/





// □■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□ Main Processes □■□■□■□■□■
const main = () => {

	const type = []

	// First, display expandBoxes of types
	/*
	for(key in typName){
		types[key] = new Type(key, typName[key])
		types[key].display(elems.main)
	}
	*/

	for(let i = 0, len = types.length; i < len; i++){
		type[types[i].typ] = new Type(types[i].typ, types[i].name)
		type[types[i].typ].display(elems.main)
	}

	// sort 'events' in ascending order by edate.
	ascEvents = events.slice()// get copy of events.
	ascEvents.sort((x, y) => (x.edate < y.edate)? -1: 1)

	// Initialize fYears to {'aa': [], 'bc': [], ・・・}
	//for(key in typName){fYears[key] = []}
	for(let i = 0, len = types.length; i < len; i++){
		fYears[types[i].typ] = []
	}

	// Get instances of EvtResvRel-object and struct fYears.
	for(let i = 0, len = ascEvents.length; i < len; i++){
		// Struct 'fYears' and create typFyear.
		const fyear = getFyear(ascEvents[i].edate)
		if(fYears[ascEvents[i].typ].indexOf(fyear) < 0){
			fYears[ascEvents[i].typ].push(fyear)
			const typFYear = new TypFYear(ascEvents[i].typ, fyear)
			typFYear.display()
		}
		// Get instances of EvtResvRel-object
		evtResvRels[ascEvents[i].eid] = new EvtResvRel(ascEvents[i])
	}

	// Add the records of reservationsRelated to evtResvRel.resvRel (array as a property of evtResvRels).
	for(let i = 0, len = reservationsRelated.length; i < len; i++){
		const rR = reservationsRelated[i]// for shortening.
		evtResvRels[rR.eid].resvRel.push(rR)
	}

	//Object.keys(evtResvRels).forEach(function(eid){
	const typsDedupe = ['wk']
	for(let eid in evtResvRels){
		const uids = []
		for(let i = 0, len = evtResvRels[eid].resvRel.length; i < len; i++){
			uids.push(evtResvRels[eid].resvRel[i].uid)
		}
		evtResvRels[eid].sold = typsDedupe.includes(evtResvRels[eid].evt.typ)? Array.from(new Set(uids)).length: uids.length
		evtResvRels[eid].display()
	}

	// Add 'messages' property to elements of 'evtResvRels'.
	for(let i = 0, len = messages.length; i < len; i++){
		//evtResvRels[msgs[i].eid].msgs.push(msgs[i])
		evtResvRels[messages[i].eid].msgs.push(new Message(messages[i]))
	}
}


const auth1 = (user, pp) => {
	uid = user; pw = pp
	doFetch('login')
}


// Initially, make form screen
const makeFormScreen = () => {

	elems = BASE_ELEM_IDS.reduce((a, v) => (a[v] = document.getElementById(v), a), {})

	const msgGuide = "<span class='bold font13 darkgreen'>KG-CCS　Admin Tools</span>"
	// メールアドレス
	const fiUid = "<div class='formitem'><span class='bold font09'>ユーザ名</span><br><input id='uid' type='text' /></div>"
	// パスワード
	const fiPw = "<div class='formitem'><span class='bold font09'>パスワード</span><br><input id='pw' type='password' /></div>"
	elems.header.innerHTML = `${msgGuide}`
	elems.loginForm.innerHTML = `${fiUid}${fiPw}`
	elems.buttons.innerHTML = `<button class='btnFull login' onClick='doFetch("login");'>LOG IN</button>`
	elems.main.innerHTML = ''
	elems.footer.innerHTML = ''
	elems.report.innerHTML = ''
	if(user.length && pp.length) auth1(user, pp)
}


// ==================
// "makeFormScreen" would be executed inline.
// ==================


