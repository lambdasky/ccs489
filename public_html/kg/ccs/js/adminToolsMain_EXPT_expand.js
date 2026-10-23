//
// adminToolsMain.js (Admin Tools Main javascript)
//

// ■□■□■□■□ Global constants □■□■□■□■
const BASE_ELEM_IDS = ['EXPT', 'header', 'loginForm', 'buttons', 'main', 'footer', 'report']

const QUERY_PATH = './includes/adminToolsQuery' + version + '.php'

const PRINT_HTML_PATH = 'print/printHtml' + version + '.php'

const EL_TEMP_REAL = document.getElementById('TEMP_REAL')


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

// The sorted 'events' in the order defined in "main".
let srtdEvents = []


// declare the object (indexed by typ names) of arrays of fyears.
// i.e, {'aa': [2020, ...], 'wk': [2017, 2018, ...], 'bc': [2017, 2018, ...], ...}
const fYears = {}

// Object (indexed by eid) of instances of EvtResvRel-object.
const evtResvRels = {}


//const typName = {aa: '入園出願予約', pr: 'プレ幼稚園予約', wk: 'わくわくキッズ', bc: 'ベビーＣＬＵＢ', er: '絵本ルーム', op: 'にこにこ広場', be: 'ベビーＣＬＵＢイベント', ce: '保育体験'}


const msgField = {afrom: 'From', ato: 'To', cc: 'Cc', bcc: 'Bcc', subject: 'Subject', body: 'Body'}


// Children indexed by emails.
let children = {}


// "dataUrls" are data for portraits.
let dataUrls = {}


// Window objects for AdmApps and BenfCertApps (both are needed to close)
let aAWin
let bCAWin


// "prxyPlnPw" is for the spoofing login by administrators which is gotten from the response of Fetch.
let prxyPlnPw





// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□■□■□ Functions □■□■□■□■□■□■□■

// "clearChildren" removes all children of the element.
const clearChildren = (elem) => {
	while(elem.firstChild){
		elem.removeChild(elem.firstChild)
	}
}



// Get his or her "School Birthyear" from the birthdate. Those born between April 2 and April 1 of the following year will have the same schBirthYear. Those with the same schBirthYear have the same age as of April 1 of each year.
// Here "birth" is assumed to hava the format "yyyy-mm-dd HH:NMM:SS".
const schBirthYear = (birth) => {
	return +birth.slice(0, 4) + ((+birth.slice(5, 7) < 4 || birth.slice(5, 10) === '04-01')? -1: 0)
}


// Get 0-padding %02d (pc: "percent").
const pc02d = (num) => {
	return ('00'+num).slice(-2)
}

// Get "yyyymmddHHNMMSS" string from the Date object.
const getYmdHMS = (dt) => {
	return dt.getFullYear() + pc02d(dt.getMonth() + 1) + pc02d(dt.getDate()) + pc02d(dt.getHours()) + pc02d(dt.getMinutes()) + pc02d(dt.getSeconds())
}



// ■□■□■□■□■□■□■□■□■□■□■□■□■□
// ■□■□■□■□ Do Fetch □■□■□■□■

// doFetch
// "opt" is an object of optional parameters. e.g, opt = {cid: ..., eid: ..., uid_cids: [...], msgDta: ...}
const doFetch = (phase, opt = {}) => {
	if(phase === 'login'){
		uid = (uid == null)? document.getElementById('uid').value : uid
		pw = (pw == null)? document.getElementById('pw').value: pw
	}
	// uid, pw, phase and the opt elements are merged into toPost.
	toPost = {uid: uid, pw: pw, phase: phase, ...opt}
	// prepare options.
	const options = {
		method: 'POST',
		headers: {
			'Accept': 'applitypion/json',
			'Content-Type': 'applitypion/json'
		},
		body: JSON.stringify(toPost),
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
			//messages = data.messages
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
		}else if(phase === 'changeNursery'){
			if(data.result === true){
				alert(data.report)
				console.log(`The reservation [rid: ${opt.rid}] for ${opt.eid} has been changed to ${data.neweid}`)
				const eids = [opt.eid, opt.eid.slice(0, -1) + (1 - opt.nursery)]
				doFetch('getResvRelByEids', {eids: eids})
			}
		}else if(phase === 'getResvRelByEids'){
			// Update resvRel arrays for the specified eids with the newly acquired data.
			// First, reset the member "resvRel".
			for(let eid of opt['eids']){
				evtResvRels[eid].resvRel = []
			}
			// Push each resvRel with acquired data.
			const resvRelByEids = data.reservationsRelatedByEids// for shortening.
			for(let i = 0, len = resvRelByEids.length; i < len; i++){
				const rR = resvRelByEids[i]// for shortening.
				evtResvRels[rR.eid].resvRel.push(rR)
			}
			// Update the target tables on screen.
			for(let eid of opt['eids']){
				const evtResvRel = evtResvRels[eid]
				// Create Resvs table. We use the one element of tblResvs (.elem).
				const tblResvs = evtResvRel.createTblResvs()
				const elPar = document.getElementById('parTblResvs_' + eid)
				clearChildren(elPar)
				elPar.appendChild(tblResvs.elem)
				//elPar.inserAdjacentHTML(tblResvs.elem)
				// Add eventListeners on [CN]s
				for(let i = 0, len = evtResvRel.resvRel.length; i < len; i++){
					document.getElementById(`btnChNurs_${evtResvRel.resvRel[i].rid}`).addEventListener('click', function(e){
						const opt = JSON.parse(e.currentTarget.dataset.opt)
						if(confirm(`${opt.clfname}さまの給付認定区分を\n${opt.nursery? '3号（2歳児）から1号（満3歳児）へ': '1号（満3歳児）から3号（2歳児）へ'}\n変更してよろしいですか？`)){
							doFetch('changeNursery', opt)
						}
					}, false)
				}
				// Put the portraits.
				if(!(eid in dataUrls)){
					doFetch('getDataUrls', {eid: eid, uid_cids: tblResvs.uid_cids})
				}
			}
		}
		// For the spoofing login.
		prxyPlnPw = data.prxyPlnPw
		//console.log(data)
	})
	.catch((error) => {
		console.error('Error:', error)
	})
}


// create expand box
/*
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
*/


// create expand box
const createExpandBox = function(id, exClass, sumHtml){
	// It is supposed that some classes are given in the CSS. e.g, div.expandBox, input.expandCheck, .expandCheck:checked + .expandBox, and so on.
	// Create outer frame (root element).
	const elOut = document.createElement('details')
	elOut.id = id
	elOut.classList.add(exClass)
	// Create the summary element.
	const elSum = document.createElement('summary')
	elSum.id = 'summary_' + id
	// Summary always has class with the same name of elOut.id
	elSum.classList.add(id)
	elSum.innerHTML = sumHtml
	// 'for' property of the label
	//const inputId = 'input_' + id
	//elLab.htmlFor = inputId
	elOut.appendChild(elSum)
	// Create input element.
	//const elInp = document.createElement('input')
	//elInp.id = inputId
	//elInp.setAttribute('type', 'checkbox')
	// class 'expandCheck' must be defined in css.
	//elInp.classList.add('expandCheck')
	//elOut.appendChild(elInp)
	// internal box(expand-collapse part)
	const elIn = document.createElement('div')
	elIn.id = 'in_' + id
	// class 'expandBox' must be defined in css.
	//elIn.classList.add('expandBox')
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
	//document.getElementById('input_' + this.key).checked = true
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
	//parent.insertBefore(expandBox, parent.firstChild)
	parent.insertAdjacentElement('afterbegin', expandBox)
}


// Events, reservations and related indexed by eid.
// The object is a constructor for event, but it will hold reservationsRelated data in much the same way.
const EvtResvRel = function(event){
	this.evt = event
	this.typfyear = event.typ + event.fyear
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
	//elPar.insertBefore(elExpBox, elPar.firstChild)
	elPar.insertAdjacentElement('afterbegin', elExpBox)
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
			//document.getElementById('parTblResvs_' + this.id).appendChild(tblResvs.elem)
			document.getElementById('parTblResvs_' + this.id).insertAdjacentElement('beforeend', tblResvs.elem)
			// Mark 
			document.getElementById('parTblResvs_' + this.id).insertAdjacentHTML('beforeend', `<div style='width: 100%;'><div id='tbl_bottom_${this.id}' style='margin: 0 35px 0 auto; width: 5rem; text-align: right; font-weight: bold;' onclick='location.href="#tbl_top_${this.id}"'>↑TOP↑</div><div>`)
			// Add eventListeners to CN buttons of the table.
			if(evtResvRel.evt.typ === 'aa' && evtResvRel.evt.apr1age === 2){
				for(let i = 0, len = evtResvRel.resvRel.length; i < len; i++){
					document.getElementById(`btnChNurs_${evtResvRel.resvRel[i].rid}`).addEventListener('click', function(e){
						const opt = JSON.parse(e.currentTarget.dataset.opt)
						if(confirm(`${opt.clfname}さまの給付認定区分を\n${opt.nursery? '3号（2歳児）から1号（満3歳児）へ': '1号（満3歳児）から3号（2歳児）へ'}\n変更してよろしいですか？`)){
							doFetch('changeNursery', opt)
						}
					}, false)
				}
			}

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
			if(evtResvRel.evt.typ === 'aa' && !(this.id in dataUrls)){
				doFetch('getDataUrls', {eid: this.id, uid_cids: tblResvs.uid_cids})
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
	// ver.011 で questuion は廃止。
	const thContents = [
		"N",
		"RID<br>[CID]<br><span class='bold'>PL</span>",
		"子ども しめい（氏名）<br>P: 利用者氏名",
		"生年月日<br>[性別]",
		`${typ === 'aa'? '家族構成<br>しめい（氏名）[続柄, B: 生年月日, Hoh: 世帯主, Ph: 電話番号, 在卒園 or Smile]': '兄弟姉妹'}`,
		"現住所, etc.<br>電話番号(CCS利用)",
		'参加<br>経験',
		`${typ === 'aa'? '[ENT]入園希望日<br>[通園]<br>[専併]<br>[英語]EngCourse希望<br>◇ 連絡等': (typ === 'pr'? '購入品・連絡等': 'コメント・質問など')}`,
		`${(typ === 'aa')? "出願": ((typ === 'pr')? "入会": "出欠")}<br><input type='checkbox' onClick='checkAll(this, "${this.evt.eid}", "participate");'>`,
		`EMAIL<br>[UID]`,
		`Sel<br><input type='checkbox' onClick='checkAll(this, "${this.evt.eid}", "sel");'>`
	]
	// Preparing CSV to export.
	let csvTxt = `${this.evt.eid}_${this.evt.etitle}\n`
	if(typ === 'aa') {
		csvTxt += "REC,uid,cid,clname,cfname,clname_k,cfname_k,cbirth,csex,hohLname,hohFname,hohLname_k,hohFname_k,zipcode,prefecture,cityarea,street,building,email,entdate,commute,concurrency,eng_course,priority,comment\n"
	} else {
		csvTxt += "REC,出欠,氏名,氏名（かな）,生年月日,性,兄弟姉妹,参加経験,保護者名,住所,メール,コメント\n"
	}
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
			// "opt" is almost a sub-object of the "rR" except for the key "clfname".
			const opt = {rid: rR.rid, cid: rR.cid, eid: rR.eid, nursery: rR.nursery, clfname: rR.clname + rR.cfname}
			addCellToRow(rows[i], -1, ['center', plusCls], `<div id='btnChNurs_${rR.rid}' data-opt='${JSON.stringify(opt)}' class='btnChNurs'>CN</div>`)
			// Teh "eventListener" will be added after the table is rendered.
		}

		// RID (rid in `reservations`), [cid] and PL(ProxyLogin) button.
		addCellToRow(rows[i], -1, ['center', 'font08', plusCls], `<div id='rid_${rR.rid}'>${rR.rid}<br>[${rR.cid}]<br><a href='${hrefDir}/?uid=${rR.uid}&pw=${prxyPlnPw}&typs=${rR.typ}' target='_blank'><span class='bold'>PL</span></a></div><div style='font-weight: bold;'>${plusCls === 'wtng'? `Waiting<br>(${i - this.evt.capacity + 1})`: ''}</div>`)

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
		// famMembers or siblings. And priority related.
		let hohLname = '', hohFname = '', hohLname_k = '', hohFname_k = ''
		let arrPriorSibs = []
		let arrCcsSibs = []
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
					if(+fm.fmGrad) arrPriorSibs.push(`${fm.fmSex === 'f'? '姉': '兄'}(${fm.fmFname})卒園`)
					if(+fm.fmEnroll) arrPriorSibs.push(`${fm.fmSex === 'f'? '姉': '兄'}(${fm.fmFname})在園`)
					if(+fm.fmSmile) arrPriorSibs.push('Smile')
					// Get Hoh info.
					if(+fm.fmHoh) {
						hohLname = fm.fmLname
						hohFname = fm.fmFname
						hohLname_k = fm.fmLname_k
						hohFname_k = fm.fmFname_k
					}
				}
			}
			addCellToRow(rows[i], -1, ['left', 'font09'], htFamMembers)
		}else{
			const siblings = children[rR.uid]
			const arrSiblings = []
			for(let j = 0; j < siblings.length; j++){
				if(siblings[j].cid !== rR.cid){
					const str = `${siblings[j].clname_k} ${siblings[j].cfname_k}（${jaCsex[siblings[j].csex]}）${siblings[j].cbirth.slice(0, 10)}生`
					arrSiblings.push(`<div>${str}</div>`)
					arrCcsSibs.push(str)
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
		//const strArrPastPt = (arrPastPt.length > 3)? `${arrPastPt.slice(0,3)}<br>${arrPastPt.slice(3,)}`: arrPastPt
		const strPastPt = arrPastPt.join('<br>')
		addCellToRow(rows[i], -1, ['center', 'wdLtd2rem'], strPastPt)
		// ENTDATE, EngCourse Hope (if yes) and comments.
		dCell = rows[i].insertCell(-1)
		dCell.classList.add('wsPreWrap', 'comment', 'wdLtd10rem')
		dCell.innerHTML = ''
		if(typ === 'aa'){
			const entdate = rR.entdate? `[ENT] ${rR.entdate.replace(/\s\d{2}:\d{2}:\d{2}/, '')}`: ''
			const commutingMethod = {foot: '徒歩登園（降園P）', bus: 'バスコース', parent: 'P送迎', none: '-'}
			const commute = rR.commute? `[通園] ${commutingMethod[rR.commute]}`: ''
			//const conc = rR.concurrency? `[専併] ${rR.concurrency === 'hei'? "併願": (rR.concurrency === 'sen'? "専願": "")}`: ''
			const conc = rR.concurrency? `[専併] ${rR.concurrency === 'sen1'? "1号専願": (rR.concurrency === 'hei'? "併願": (rR.concurrency === 'sen23'? "2・3号専願": ""))}`: ''
			const priorSibs = `[優先]${arrPriorSibs.length? arrPriorSibs.join('，'): 'No Priority'}`
			dCell.innerHTML += [entdate, commute, conc, priorSibs].join('<br>')
			if(+rR.eng_course) dCell.innerHTML += `<br>[英語] ${schBirthYear(rR.cbirth) + 5}年度`
		}
		dCell.innerHTML += rR.comment.length? `<br>◇ ${rR.comment}`: ''
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

		// CSV text to export.
		// Note that the ="${rR.street}" has an equal (=) sign and double quotations. This is to prevent the values in this column from being recognized as dates.
		const commentForCsv = rR.comment.replaceAll(',','，').replaceAll('\n', ' ')
		if(typ === 'aa') {
			csvTxt += `${i+1},${rR.uid},${rR.cid},${rR.clname},${rR.cfname},${rR.clname_k},${rR.cfname_k},${rR.cbirth},${rR.csex},${hohLname},${hohFname},${hohLname_k},${hohFname_k},${rR.zipcode},${rR.prefecture},${rR.cityarea},="${rR.street}",${rR.building? rR.building: ''},${rR.email},${rR.entdate},${rR.commute},${rR.concurrency},${rR.eng_course? schBirthYear(rR.cbirth)+5: ''},${arrPriorSibs.length? arrPriorSibs.join('，'): 'No Priority'},${commentForCsv}\n`
		} else {
			// csvTxt += "REC,出欠,氏名,氏名（かな）,生年月日,性,兄弟姉妹,参加経験,保護者氏名,住所,メール\n"
			csvTxt += `${i+1},${rR.participate? '1': ''},${rR.clname+' '+rR.cfname},${rR.clname_k+' '+rR.cfname_k},${rR.cbirth},${rR.csex},${arrCcsSibs.join('，')},${rR.pastpt.join(' ')},${rR.ulname+' '+rR.ufname},${rR.zipcode+' '+rR.prefecture+rR.cityarea+rR.street+' '+(rR.building? rR.building: '')},${rR.email},${commentForCsv}\n`
		}
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
		const toPost = {eid: this.id, participate: getChecks(this.id, 'participate'), sel: getChecks(this.id, 'sel')}
		doFetch('updateChecks', toPost)
	}, false)
	const elCap = elTable.createCaption()
	elCap.classList.add('right', 'font09')
	const elWrap = document.createElement('div')
	elWrap.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-end;'
	elWrap.insertAdjacentHTML('beforeend', `<div style='font-weight: bold; font-size: 1.2rem;'>［${this.evt.eid}］${this.evt.etitle}（${this.sold}/${((+this.evt.capacity > 0)? this.evt.capacity: '定員未設定')}）</div>`)
	// Button to download the CSV file.
	const elDlCsv = document.createElement('button')
	elDlCsv.classList.add('dlCsv')
	elDlCsv.innerHTML = 'DL CSV'
	const filename = `${this.evt.eid}_${this.evt.etitle}_${getYmdHMS(new Date())}.csv`
	elDlCsv.addEventListener('click', function(e) {
		const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
		const blob = new Blob([bom, csvTxt], {type: 'text/csv'})
		const elAnchor = document.createElement('a')
		elAnchor.href = URL.createObjectURL(blob)
		elAnchor.download = filename
		EL_TEMP_REAL.appendChild(elAnchor)
		elAnchor.click()
		EL_TEMP_REAL.removeChild(elAnchor)
		delete elAnchor
	}, false)
	elWrap.insertAdjacentElement('beforeend', elDlCsv)
	// Abbreviations for participation exprience.
	elWrap.insertAdjacentHTML('beforeend', `<div id='tbl_top_${this.evt.eid}' class='dlCsv' style='width: auto; font-weight: bold;' onclick='location.href="#tbl_bottom_${this.evt.eid}"'>↓BTM↓</div>`)
	//elWrap.insertAdjacentHTML('beforeend', `<div style='width: 16rem; font-size: 0.8rem'>［参加経験］wk: わくわくキッズ，bc: ベビーCLUB，er: 絵本ルーム，op: にこにこ広場，be: ベビーCLUBイベント，ce: 保育体験</div>`)
	elCap.insertAdjacentElement('beforeend', elWrap)
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
		if(arr[regs[i].uid] === undefined) arr[regs[i].uid] = []
		const value = {cid: regs[i].cid, clname_k: regs[i].clname_k, cfname_k: regs[i].cfname_k, csex: regs[i].csex, cbirth: regs[i].cbirth}
		arr[regs[i].uid].push(value)
	}
	return arr
}





// □■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□ Main Processes □■□■□■□■□■
const main = () => {
	const type = []

	for(let i = 0, len = types.length; i < len; i++){
		type[types[i].typ] = new Type(types[i].typ, types[i].name)
		type[types[i].typ].display(elems.main)
	}

	// Use a copy of "events".
	srtdEvents = events.slice()
	// srtdEvents are sorted in ORDER BY fyear ASC, apr1age ASC, nursery DESC and edate ASC.
	srtdEvents.sort((x, y) => {
		if(x.fyear < y.fyear) return -1
		if(x.fyear > y.fyear) return 1
		if(x.apr1age < y.apr1age) return -1// apr1age === NULL for all except typ "aa".
		if(x.apr1age > y.apr1age) return 1// Same as above.
		if(x.nursery > y.nursery) return -1// Also nursery === NULL for all except typ "aa".
		if(x.nursery < y.nursery) return 1// Same as above.
		if(x.edate < y.edate) return -1// Therefore, except for "aa", the order is determined by "edate".
		if(x.edate > y.edate) return 1
		return 0
	})

	// Initialize the object "fYears" to {'aa': [], 'bc': [], ・・・}
	for(let i = 0, len = types.length; i < len; i++){
		fYears[types[i].typ] = []
	}

	// Get instances of EvtResvRel-object and struct fYears.
	for(let i = 0, len = srtdEvents.length; i < len; i++){
		// Struct 'fYears' and create typFyear.
		if(fYears[srtdEvents[i].typ].indexOf(srtdEvents[i].fyear) < 0){
			fYears[srtdEvents[i].typ].push(srtdEvents[i].fyear)
			const typFYear = new TypFYear(srtdEvents[i].typ, srtdEvents[i].fyear)
			typFYear.display()
		}
		// Get instances of EvtResvRel-object
		evtResvRels[srtdEvents[i].eid] = new EvtResvRel(srtdEvents[i])
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

	const msgGuide = `<div style='display: flex; justify-content: space-between;'>
		<div>
			<div class='kgName'>清教学園幼稚園</div>
			<div class='bold font13 darkgreen'>KG-CCS　Admin Tools</div>
		</div>
		<div style='display: flex; align-items: flex-start;'>
			<div>［参加経験］</div>
			<div style='width: 20rem; font-size: 0.7rem'>wk: わくわくキッズ，bc: ベビーCLUB，er: 絵本ルーム，op: にこにこ広場，be: ベビーCLUBイベント，ce: 保育体験</div>
		</div>
	</div>`
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


