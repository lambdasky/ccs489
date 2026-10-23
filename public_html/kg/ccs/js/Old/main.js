//
// CCS main.js
//


// ■■■■■ Global variables ■■■■■　（NEW)

// ■□■□■□■□ CONSTANTS □■□■□■□■
const QUERY_PATH = './includes/query' + version + '.php'


// Date related.
// Current FY (Fiscal Year = School Year)
const CUR_FY = (() => {
	const dtNow = new Date()
	return dtNow.getFullYear() + (dtNow.getMonth() < 3? -1: 0)
})()


// The April 1st of the next year.
// Remark that the ordinal number of months are 0(Jun.), 1(Feb.), ... 11(Dec.).

// Next April 1 in Date-format.
const DT_NEXT_APR1 = (() => {
	const now = new Date()
	return new Date(now.getFullYear() + (now.getMonth() < 3? 0: 1), 3, 1)
})()

// Next April 1 in the format "Y-m-d".
const NEXT_APR1 = `${CUR_FY + 1}-04-01`

// The followings are the dates in 8digit-number format, e.g. 20230920

// The 8digit-number of the last April 1st.
const NUM_LAST_APR1 = 10000 * CUR_FY + 401

// The 8digit-number of the last April 1st. e.g. 20240401
const NUM_NEXT_APR1 = 10000 * (CUR_FY + 1) + 401



// ■□■□■□■□■□■□■□■□■□■□■□■□■□■


// Object of basic division elements (indexed by its id).
// It will be used in the form of  elem.report.innerHTML = "<h1>Welcome!!</h1>".
// It is defined by the function "createBasicElements".
let elem = {}

// "newPw" is set when phase is 'regUser', 'chPw' or 'resetPw'.
let newPw = ''

// "typs" is determined by "qsTyps" (from QUERYSTRING) in initialize()
let typs = ''

// Prior typ and fwdDays
let priorTyp = ''
let priorFwdDays = 0

// datetime of Now. It can be either true now or a set value. It is defined in main().
let dtNow

// UNIXTIME of Now for "dtNow".
let utNow

// Does hoh(head of household) equal to usr(user)?
//let hohequsr


// famMembers is the array of Family Member objects.
// It will be initialized to user.fam_members and they are identical.
let famMembers

// famRel is the family state which will be identical to fam_rel as well as famMembers.
let famRel

// "inPriorityPeriod" means "Is it in Priority Period?".
let inPriorityPeriod
/**************/


let evts = []
let resvs = []

// 'uid' and 'email' have been defined in the parent script.
// "user" is an object obtained from the server as a record of the table `users` for a specific uid.
let user

// "childrenExt" is an array of children for the user (uid) above under the condition that valid === 1 or entdate IS NOT NULL. And then "children" is limited to only those of them that satisfy valid === 1.
// "childrenExt" is only used for constructing "famMembers" in "aa" (admission application).
// "children" is used for all conventional reservations.
let childrenExt
let children

// 'newEmail' must be global for it is used aross different phases.
//let newEmail = ''

// "evtsResvs" (which stands for "events reservations") is an object of instances of EventReservations indexed by eid. We will use this to handle future events.
let evtsResvs

// "chnResvs" (which stands for "children reservations") is an object of instances of ChildReservations indexed by cid. It will be used to handle the children of the same parent (user).
let chnResvs

// extraAuth takes one of the values {'', Administrator', 'Developer', 'SuperUser'} and initially ''.
let extraAuth = ''

let loggedIn = false

let reqdText = []
let reqdTextPlus = []// For Hoh or Par

let htQueryButton = ''

// cid currently set.
let curCid = 0

/* ★★★ global parameters for Debug ★★★ */
let gData// copy of 'data' in doFetch().
let msData// copy of 'data' in modifyScreen().
let gArr = {}// for debug
/* ★★★★★★★★★★★★★★★★★★★★★★★ */


// Portrait related.
// original dataUrl. This for debug.
let orgDataUrl = ''

// "newDataUrl" is the dataUrl to upload, which is obtained from the original rusult of FileReader.readAsDataURL(). And dataUrl has a format such as data:image/png;base64,[...base64_encoded_data...]
let newDataUrl = ''
// "cnvs" is for the canvas element.
let cnvs = null
// width and height of the canvas.
const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 900


// Constants
// If 'aaDate' is required or not.
//const isAaDateReqd = false

const typNames = {}


// "postData" is the Post-Data object which is posted in "doFetch()".
// It will be at first initialized in "initialize()"
const postData = {}

const GLOBALS = ['phase', 'email', 'uid', 'pw', 'newPw', 'typs', 'utNow', 'basicUrl', 'priorTyp', 'famMembers', 'famRel', 'newDataUrl']

const POST_DATA_KEYS = ['phase', 'email', 'newEmail', 'uid', 'pw', 'newPw', 'typs', 'eid', 'typ', 'utNow', 'basicUrl', 'priorTyp', 'ulname', 'ufname', 'ulname_k', 'ufname_k', 'hohequsr', 'hlname', 'hfname', 'hlname_k', 'hfname_k', 'zipcode', 'prefecture', 'cityarea', 'street', 'building', 'uphone', 'hphone', 'scharea', 'schareaplus', 'fam_members', 'fam_rel', 'cid', 'clname', 'cfname', 'clname_k', 'cfname_k', 'cbirth', 'csex', 'pastpt', 'entdate', 'graddate', 'eng_course', 'rid', 'comment', 'advUid', 'advRid', 'newDataUrl']


// Finally we declare the ultimate global object GL.
// This can be used for anything. All the above variables could also be included in this.
const GL = {}


// The following FORM_PHASES is not needed after all. Because we use endsWith() and slice(). 
// Phases of fomrs.
// If the current phase is one of these, the doFetch-button has the next phase, which is the same string as the current phase with the trailing "Form" removed.
//const FORM_PHASES = ['regEmailForm', 'regUserForm', 'loginForm', 'chgEmailForm', 'chgPwForm', 'resetPwForm', 'modUserForm', 'addChildForm', 'modChildForm', 'addResvForm']


// "dspWtngState": display waiting state. 
//const dspWtngState = (qsDspWtngState && qsDspWtngState.match(/^y(es|)$/))? true: false
const dspWtngState = true

// "dspAdminInfo": display administrator information.
const dspAdminInfo = (qsDspAdminInfo && qsDspAdminInfo.match(/^y(es|)$/))? true: false

// "dspExptEvts": display experiment events.
const startAt = qsStartAt? qsStartAt: ''


// red asterisk
const AST = `<span class='red'>*</span>`


// Preparation Process


// Button to send URL for Password-Reset
const guidePwReset = `<button class='sendPwResetUrl' onClick='cfmSendPwResetUrl("${email || uid}")'>パスワード・リセット</button><div class='font08 red'>パスワードをお忘れの場合はリセットを行ってください！</div>`



const ut20200901000000 = new Date('2020/09/01 00:00:00').getTime()//Begin 入園出願予約のための利用者登録受付開始
const ut20201001000000 = new Date('2020/10/01 00:00:00').getTime()//Begin 入園出願予約受付開始
//const ut20201001080000 = new Date('2020/10/01 08:00:00').getTime()//End 入園出願予約受付終了
const ut20210401000000 = new Date('2021/04/01 00:00:00').getTime()//End 入園出願予約受付終了

//const inRegPeriod = (ut20200901000000 <= utNow && utNow < ut20210401000000)? true: false

//const inAppPeriod = (ut20201001000000 <= utNow && utNow < ut20210401000000)? true: false



// Gloabal instance for FormItem
let fI



// Class defining Form Items
const FormItem = function(ph, typs){
	this.email = `<div class='formItem'>
	<span class='bold font12 black'>メールアドレス</span><br>
	<input id='email' type='text' onChange='chkEmail(this); dBDF()'><br>
	<span id='msg_email' class='red'></span>
	</div>`
	
	this.newEmail = `<div class='formItem'>
	<span id='strEmail' class='bold font12 black'>${ph === 'chgEmailForm'? '新しい': ''}メールアドレス</span><br>
	<input id='newEmail' type='text' onKeyUp='chkEmail(this); dBDF()'><span class='visHidden'>--</span><button class='testEmail' onClick='testNewEmail()'>TEST</button><br>
	<span class='bold font8 crimson'>＊変更前に TEST ボタンで受信テストを行ってください！</span><br>
	<span id='msg_newEmail' class='red'></span>
	</div>`
	
	this.pw = `<div class='formItem'>
	<span id='strPw' class='bold font11 black'>${ph === 'chgPwForm'? '現在の': ''}パスワード</span><br>
	<input id='pw' type='password' size='18' onKeyUp='chkPw(this); dBDF()'><br>
	<span id='msg_pw' class='red'></span><br>
	<span class='chgType' onClick='chgInputType("pw", this)'>パスワードを表示</span>
	</div>`
	
	this.newPw = `<div class='formItem'>
	<span id='strNewPw' class='bold font11 black'>${ph === 'chgPwForm'? '新しい': ''}パスワード</span><br>
	<input id='newPw' type='password' size='18' onKeyUp='chkPw(this); dBDF()'><br>
	<span class='bold font08 blue'>半角英数字、記号で6文字以上16文字以下（使用できない記号もあります）</span><span id='msg_newPw' class='red'></span><br>
	<span class='chgType' onClick='chgInputType("newPw", this)'>パスワードを表示</span>
	</div>`
	
	// User（利用者）
	this.user = `<div class='formItem'>
		<span class='bold font12 black'>利用者（保護者）氏名${AST}</span><br>
		<table class='lfName'>
			<tr><td>姓</td><td>名</td></tr>
			<tr><td><input id='ulname' type='text' onKeyUp='dBDF()'></td><td><input id='ufname' type='text' onKeyUp='dBDF()'></td></tr>
			<tr><td>ひらがな（姓）</td><td>ひらがな（名）</td></tr>
			<tr><td><input id='ulname_k' type='text' onKeyUp='dBDF()'></td><td><input id='ufname_k' type='text' onKeyUp='dBDF()'></td></tr>
		</table>
		<br>
		<span class='bold font11 black'>利用者電話番号</span><br>
		<span class='bold font08 palevioletred'>数字のみ（ハイフンなし）でOK</span><br>
		<input id='uphone' type='text' onChange='convNumHyph2Half(this); chkPhone(this); dBDF()'>${AST}<br>
		<span id='msg_uphone' class='palevioletred'></span>	
	</div>`
	
	// 世帯主. "hoh" means the head of household (family).
	this.hoh = `<div class='formItem'>
		<span class='bold font11 black'>世帯主</span>${AST}<br>
		<input type='checkbox' id='hohEqUsr' onChange='dBDF()'>世帯主は利用者に同じ<br>
		<div id='hohForm'>
			<span class='bold font11'>世帯主氏名</span>${AST}<br>
			<table class='lfName'>
				<tr><td>姓</td><td>名</td></tr>
				<tr><td><input id='hlname' type='text' onKeyUp='dBDF()'></td><td><input id='hfname' type='text' onKeyUp='dBDF()'></td></tr>
				<tr><td>ひらがな（姓）</td><td>ひらがな（名）</td></tr>
				<tr><td><input id='hlname_k' type='text' onKeyUp='dBDF()'></td><td><input id='hfname_k' type='text' onKeyUp='dBDF()'></td></tr>
			</table>
			<br>
			<span class='bold font11 black'>世帯主電話番号</span><br>
			<span class='bold font08 palevioletred'>数字のみ（ハイフンなし）でOK</span><br>
			<input id='hphone' type='text' onChange='convNumHyph2Half(this); chkPhone(this); dBDF()'><br>
			<span id='msg_hphone' class='palevioletred'></span>		
		</div>
	</div>`

	// Address of the user.
	this.address = `<div class='formItem'>
		<span class='bold font12 black'>住所</span>　<span class='lighter font07 dimgray'>（郵便番号による自動検索あり）</span><br>
		郵便番号 <span class='bold font08 palevioletred'>数字のみ（ハイフンなし）でOK</span><br>
		<input id='zipcode' type='text' onChange='chkZipcode(this); AjaxZip3.zip2addr(this, "", "prefecture", "cityarea"); dBDF()'>${AST} <span id='msg_zipcode' class='palevioletred'></span><br>
		都道府県<br>
		<input id='prefecture' type='text' name='prefecture' onChange='dBDF()' placeholder='（自動検索）'>${AST}<br>
		町域まで<br>
		<input id='cityarea' type='text' name='cityarea' onChange='dBDF()' placeholder='（自動検索）'>${AST}<br>
		表示番号（丁目，番地等）<br>
		<input id='street' type='text' onChange='convNumHyph2Half(this); dBDF()'>${AST}<br>
		建物名等<br>
		<input id='building' type='text'>
	</div>`
	
	const arrSchools = ['', 'その他', '河内長野市立天野小学校', '河内長野市立加賀田小学校', '河内長野市立高向小学校', '河内長野市立小山田小学校', '河内長野市立三日市小学校', '河内長野市立川上小学校', '河内長野市立長野小学校', '河内長野市立石仏小学校', '河内長野市立天見小学校', '河内長野市立南花台小学校', '河内長野市立楠小学校', '河内長野市立美加の台小学校', '河内長野市立千代田小学校', '富田林市立久野喜台小学校', '富田林市立錦郡小学校', '富田林市立向陽台小学校', '富田林市立高辺台小学校', '富田林市立寺池台小学校', '富田林市立新堂小学校', '富田林市立小金台小学校', '富田林市立富田林小学校', '富田林市立川西小学校', '富田林市立彼方小学校', '富田林市立藤沢台小学校', '富田林市立大伴小学校', '富田林市立喜志西小学校', '富田林市立伏山台小学校', '富田林市立喜志小学校', '富田林市立東条小学校', '大阪狭山市立北小学校', '大阪狭山市立第七小学校', '大阪狭山市立西小学校', '大阪狭山市立東小学校', '大阪狭山市立南第一小学校', '大阪狭山市立南第二小学校', '大阪狭山市立南第三小学校','千早赤阪村立千早小吹台小学校','千早赤阪村立赤阪小学校']
	
	let options = ''
	for(let i = 0, len = arrSchools.length; i < len; i++){
	options += `<option value='${arrSchools[i]}'>${arrSchools[i]}</option>`
	}
	
	this.schArea = `<div class='formItem'>
	<span class='bold font12 black'>小学校区</span><br>
	<span class='bold font09'>河内長野市・富田林市・大阪狭山市以外に在住の方または転居等で不明な場合は「その他」を必ず選択してください。</span><br>
	<select id='scharea' name='scharea' onChange='dBDF()'>${options}</select>${AST}
	</div>`
	
	this.schAreaPlus = `<div class='formItem'>
	<span class='bold font11 black'>その他の小学校区等</span><br>
	<span class='bold font09'>（河内長野市・富田林市・大阪狭山市以外に在住の方または転居等で不明な場合はこちらにご入力ください（「□□立◯◯小学校」または「不明」）</span><br>
	<input id='schareaplus' type='text' onKeyUp='dBDF()'><br>
	<div id='remarkSchareaplus' class='lighter font08 red'></div>
	</div>`
	
	this.cId = `<input id='cid' type='hidden'>`
	
	this.cName = `<div class='formItem'>
	<span class='bold font12 black'>子ども氏名${AST}</span><br>
	<table class='lfName'>
		<tr><td>姓</td><td>名</td></tr>
		<tr><td><input id='clname' type='text' onKeyUp='dBDF()'></td><td><input id='cfname' type='text' onKeyUp='dBDF()'></td></tr>
		<tr><td>ひらがな（姓）</td><td>ひらがな（名）</td></tr>
		<tr><td><input id='clname_k' type='text' onKeyUp='dBDF()'></td><td><input id='cfname_k' type='text' onKeyUp='dBDF()'></td></tr>
	</table>
	</div>`
	
	this.cBirth = `<div class='formItem'>
	<span class='bold font12 black'>生年月日</span><br>
	<span class='bold font09'>生年月日により予約可能な項目が異なりますので、お間違いのないようにご入力ください。</span><br>
	<input id='cbirth' type='date' onChange='dBDF()'>${AST}
	</div>`
	
	this.cSex = `<div class='formItem'>
	<span class='bold font12 black'>性別</span>${AST}<br>
	<input type='radio' name='csex' value='m' onChange='dBDF()'>&nbsp;男
	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
	<input type='radio' name='csex' value='f' onChange='dBDF()'>&nbsp;女
	</div>`
	
	this.pastPt = ''

	// For AA (Admission Application）.
	this.aaHeader = `<div class='formItem'>
		
	</div>`

	// Family members and the form to add or edit a member.
	this.famState = `<div class='formItem' id='famState'>
		<div id='famStateHeader'></div>
		<!-- famMembers related -->
		<div id='parFamMemberForm'>
			<div id='famMemberFormHeader'></div>
			<div id='famMemberForm'></div>
		</div>
		<div id='parFamMembers'>
			<div id='famMembersHeader'></div>
			<div id='famMembers'></div>
		</div>
		<!-- famRel related -->
		<div id='parFamRelForm'>
			<div id='famRelFormHeader'></div>
			<div id='famRelForm'></div>
		</div>
		<div id='parFamRel'>
			<div id='famRelHeader'></div>
			<div id='famRel'></div>
		</div>
	</div>`

	// Portrait of the child seeking admission.
	this.portrait = `<div class='formItem' id='portrait'>
		<div id='parPortraitCtrl'>
			<div id='portraitCtrlHeader'>出願児童の写真</div>
			<div id='portraitCtrl'></div>
		</div>
	</div>`
	
}





// ■■■■■■■ Functions ■■■■■■■
const replaceHohNameWithPars = function(){
	consolr.log('No problem...')
}



const getJstFromStr = (strTime) => {
	return Date.parse(strTime.replace(' ', 'T') + '+09:00')
}



// 0-padding to display two digits. "p02d" is from "%02d" in "printf" of C.
const p02d = (n) => ('0' + n).slice(-2)



// Get "Y-m-d H:M:S" from Date.
const getYmdHMS = (dt) => {
	const a00 = [dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds()].map(x => p02d(x))
	return `${dt.getFullYear()}-${a00[0]}-${a00[1]} ${a00[2]}:${a00[3]}:${a00[4]}`
}



// Get "Y-m-d" from Date.
const getYmd = (dt) => {
	const a00 = [dt.getMonth() + 1, dt.getDate()].map(x => ('0' + x).slice(-2))
	return `${dt.getFullYear()}-${a00[0]}-${a00[1]}`
}



// Capitalization of a string
const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}



// Date
// get the date(string) some days after the present in format "yyyy-mm-dd".
const dateDaysLater = (days) => {
	let dt = new Date()
	dt.setDate(dt.getDate() + days)
	const yyyy = dt.getFullYear()
	const mm = ('0' + (dt.getMonth() + 1)).slice(-2)
	const dd = ('0' + dt.getDate()).slice(-2)
	return yyyy + '-' + mm + '-' + dd
}



// Comaparing DateTime.
const compDts = (dt0, dt1) => {
	return dt0.getTime() < dt1.getTime()? -1: (dt0.getTime() === dt1.getTime()? 0: 1)
}



// Comparing Y-m-d.
// Compare two datetimes ymd0 and ymd1 (with format 'yyyy-mm-dd HH:MM:SS'), and returns -1, 0 or 1 when ymd0 < ymd1, ymd0 === ymd1 or ymd0 > ymd1 respectively.
// If a parameter has the format with time part " HH:MM:SS", then the time part is omitted before comparing.
const compYmds = (ymd0, ymd1) => {
	// Parsing the parameters.
	const ymds = [ymd0, ymd1]
	for(let i = 0; i < ymds.length; i++){
		if(!ymds[i].match(/^\d{4}-\d{2}-\d{2}(|\s\d{2}:\d{2}:\d{2})$/)) return false
		// Delete the time-part if exists.
		ymds[i] = ymds[i].replace(/\s\d{2}:\d{2}:\d{2}/, '')
	}
	// Compare them
	return ymds[0] < ymds[1]? -1: (ymds[0] === ymds[1]? 0: 1)
}



// Obtain the age at the target date from the date of birth with format "Y-m-d H:M:S".
// When target is not given, today is set.
/*
const getAgeAt = (birth, target) => {
	const b = new Date(birth)
	const numBirth = 10000 * b.getFullYear() + 100 * b.getMonth() + b.getDate()
	const t = target? (new Date(target)): (new Date())
	const numTarget = 10000 * t.getFullYear() + 100 * t.getMonth() + t.getDate()
	return Math.floor((numTarget - numBirth) / 10000)
}
*/



// QueryString
const chgTypsValue = (url, val) => {
	let str = url
	// remove anchor.
	str = str.replace(/#.*$/, '')
	// If val is void:
	if(val === ''){
		str = str.replace(/typs=[^&]*&?/, '')
	}else{
		if(str.match('typs=')){
			str = str.replace(/typs=[^&]*&?/, 'typs=' + val + '&')
		}else{
			if(str.indexOf('?') > 0){
				str = str.replace('?', '?typs=' + val + '&')
			}else{
				str = str + '?typs=' + val
			}
		}
	}
	return str.replace(/(&|\?)$/, '')
}



// Convert Numbers and Hyphens to half-width.
const convNumHyph2Half = (obj) => {
	obj.value = obj.value.replace(/[−ー〜~–一]/g, '-')
	obj.value = obj.value.replace(/[０-９]/g, function(s){return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)})
}



// Check formats
const chkZipcode = (obj) => {
	convNumHyph2Half(obj)
	obj.value = obj.value.match(/^\d{7}$/)? obj.value.slice(0, 3) + '-' + obj.value.slice(3, 7): obj.value
	const msg = obj.value.match(/(^$|\d{3}-\d{4}$)/)? '': '<br>郵便番号形式をご確認ください！'
	document.getElementById('msg_' + obj.id).innerHTML = msg
}



const chkPhone = (obj) => {
	convNumHyph2Half(obj)
	const nums = obj.value.replace(/-/g, '')
	obj.value = nums.match(/^[0-9]{10,11}$/)? addHyphensToPhoneNumber(nums): obj.value
	const msg = (obj.value.match(/(^$|^0\d{1,4}-\d{1,4}-\d{4}$)/) && (obj.value.length == 0 || obj.value.length == 12 || obj.value.length == 13))? '': '電話番号形式が不正です！'
	document.getElementById('msg_' + obj.id).innerHTML = msg
}



const chkEmail = (obj) => {
	obj.value = obj.value.toLowerCase()
	const msg = obj.value.match(/(^$|^[\w.\-]+@[\w\-]+\.[\w.\-]+$)/i)? '': 'メールアドレス形式をご確認ください！'
	document.getElementById('msg_' + obj.id).innerHTML = msg
}



const chkPw = (obj) => {
	const msg = obj.value.match(/(^$|^[a-z\d!-\/:-@-~]{6,16}$)/i)? '': '<br>パスワード形式をご確認ください！'
	document.getElementById('msg_' + obj.id).innerHTML = msg
}



const chkSchareaSchareaplus = (obj, objPlus) => {
	if(obj.value === 'その他' && !objPlus.value.length){
		document.getElementById('remarkSchareaplus').innerHTML = '「小学校区」で「その他」を選択した場合は「その他の小学校区等」に入力してください。'
		return false
	}
	if(obj.value.length && obj.value !== 'その他' && objPlus.value.length){
		document.getElementById('remarkSchareaplus').innerHTML = '「小学校区」で「その他」を選択していないときは「その他の小学校区等」には入力しないでください。'
		return false
	}
	document.getElementById('remarkSchareaplus').innerHTML = ''
	return true
}



// Search address by zipcode.
const Zip2Addr = (obj) => {
	AjaxZip3.zip2addr(obj, '', 'prefecture', 'cityarea')
}



// Verify Checkbox or Radiobutton is "checked".
const isChecked = (name) => {
	const names = document.getElementsByName(name)
	let countChecked = 0
	for(let i = 0, len = names.length; i < len; i++){
		if(names[i].checked === true) countChecked++
	}
	if(countChecked){
		return true
	}else{
		return false
	}
}



// ＊＊＊ Checking validation (each returns boolean value).＊＊＊
// Zipcode
const isZipcodeVAlid = (zipcode) => {
	return zipcode.match(/(^$|^\d{3}-\d{4}$)/)
}

// Phone
const isPhoneValid = (phoneNumber) => {
	return (phoneNumber.match(/(^$|^0\d{1,4}-\d{1,4}-\d{4}$)/) && (phoneNumber.length == 0 || phoneNumber.length == 12 || phoneNumber.length == 13))
}



// Checking if the inputs are valid or not.
const areInputsValid = () => {
	const ph = phase
	if(ph !== 'addResvForm'){
		for(let i = 0, len = reqdText.length; i < len; i++){
			if(!document.getElementById(reqdText[i]).value.length) return false
		}
	}
	if(ph === 'regEmailForm'){
		if(!document.getElementById('email').value.match(/(^$|^[\w.\-]+@[\w\-]+\.[\w.\-]+$)/i)) return false
	}
	if(ph === 'loginForm'){
		if(!document.getElementById('pw').value.match(/(^$|^[a-z\d!-\/:-@-~]{6,16}$)/i)) return false
	}
	if(ph === 'chgEmailForm'){
		if(!document.getElementById('newEmail').value.match(/(^$|^[\w.\-]+@[\w\-]+\.[\w.\-]+$)/i)) return false
	}
	if(['regUserForm', 'modUserForm'].includes(ph)){
		if(!isZipcodeVAlid(document.getElementById('zipcode').value)) return false
		const valPhone1 = document.getElementById('uphone').value
		if(!isPhoneValid(valPhone1)) return false
		const valPhone2 = document.getElementById('hphone').value
		if(!isPhoneValid(valPhone2)) return false
		if(!chkSchareaSchareaplus(document.getElementById('scharea'), document.getElementById('schareaplus'))) return false
		let reqdTextBound = [...reqdText, ...(document.getElementById('hohEqUsr').checked? []: reqdTextPlus)]
		for(let i = 0, len = reqdTextBound.length; i < len; i++){
			if(!document.getElementById(reqdTextBound[i]).value.length) return false
		}
	}
	if(['chgPwForm', 'resetPwForm'].includes(ph)){
		const valNewpw = document.getElementById('newPw').value
		if(!valNewpw.match(/(^$|^[a-z\d!-\/:-@-~]{6,16}$)/i)) return false
	}
	if(['addChildForm', 'modChildForm'].includes(ph)){
		const csex = document.getElementsByName('csex')
		if(!(csex[0].checked || csex[1].checked)) return false
	}
	if(ph === 'addResvForm'){
		if(!isChecked('evtToReserve')) return false
		if(!(['aa', 'pr'].includes(typs) || isChecked('pastpt'))) return false
		//if(typs === 'aa' && isAaDateReqd && !document.getElementById('aaDate').value.length) return false
		if(typs === 'aa'){
			if(!document.getElementById('entDate').value) return false
		}
	}
	if(ph === 'modAdmAppForm'){
		// Is is prepared separately.
	}
	return true
}



// display the button to execute "doFetch" if the inputs are valid.
const dspBtnDoFetch = () => {
	//const phaseToPost = phase in form2req? form2req[phase]: phase
	const phaseToPost = phase.endsWith('Form')? phase.slice(0, -4): phase
	const btnDoFetch = `<button type='button' class='full doFetch' onClick='doFetch("${phaseToPost}")'>送信</button>`
	const askDBDF = `<button type='button' class='full grayOut' onClick='dBDF()'>送信</button><div id='msgBu' class='lighter font07 red'>ボタンが明示されないときはここを押してください。</div>`
	if(areInputsValid()){
		elem.buttons.innerHTML = btnDoFetch
	}else{
		elem.buttons.innerHTML = askDBDF
		document.getElementById('msgBu').innerHTML = '未入力や形式不正の箇所がないかご確認ください。'
	}
}
const dBDF = dspBtnDoFetch
let noDBSQ = 0



// send test message to the 'newEmail' address.
const testNewEmail = () => {
	const newEmail = document.getElementById('newEmail').value
	if(newEmail.match(/(^$|^[\w.\-]+@[\w\-]+\.[\w.\-]+$)/i)){
		if(confirm(`@seikyogakuen.org から${newEmail}にテスト送信します`)) doFetch('testNewEmail')
		console.log(email + ': requested to send test-message')
	}else{
		alert('メールアドレスの形式が不正です。ご確認ください。')
	}
}



const turnOffPastPtChecks = (obj) => {
	if(obj.checked){
		if(obj.value === 'ft'){
			for(let k = 1, len = Object.keys(typNames).length; k <= len; k++){
				document.getElementsByName('pastpt')[k].checked = false
			}
		}else{
			document.getElementsByName('pastpt')[0].checked = false
		}
	}
}



// Create the formItem for "pastPt" 
const createFiPastPt = (typs) => {
	// When typs == 'aa', we don't ask pastpt(past-participation) and it is set to be invisible. However, "ft" is supposed to be checked for passing through "areInputsValid()".
	let inputs = `<input type='checkbox' name='pastpt' value='ft'${['aa', 'pr'].includes(typs)? " checked='checked'": ""} onChange='dBDF(); turnOffPastPtChecks(this)'>初めて<br>`
	for(let typ of Object.keys(typNames)){
		inputs += `<input type='checkbox' name='pastpt' value='${typ}' onChange='dBDF(); turnOffPastPtChecks(this)'>${typNames[typ]}<br>`
	}
	// Remark that the id(='pastPt') is given to this form-Item element.
	return `<div id='pastPt' class='${['aa', 'pr'].includes(typs)? 'displayNone': 'formItem'}'><span class='bold font10'>参加したことのあるプログラム種別をチェックしてください。</span>${AST}<br>${inputs}</div>`
}



// Return to the home screen. ("bwdPrevScreen" in old versions)
const returnHome = (msg) => {
	curCid = 0//cancel
	let htMain = '', htPhase = ''
	if(msg && msg.length){// i.e, phase is 'regEmailForm', 'regUserForm' or 'loginForm'.
		htPhase = 'ようこそ！'
		htMain = msg
	}else{
		htPhase = '登録・予約状況'
		htMain = joinChnResvsHtml(false) + dspUser(user)
	}
	elem.phaseTitle.innerHTML = htPhase
	elem.report.innerHTML = ''
	elem.message.innerHTML = ''
	elem.guide.innerHTML = ''
	elem.btnBackward.innerHTML = ''
	elem.forms.innerHTML = ''
	//elem.main.style.display = 'block'
	turnOnOffDisplay(['main'], [])
	elem.main.innerHTML = htMain
	elem.buttons.innerHTML = ''
	noDBSQ = 0
	scrollTo('phaseTitle')
}



// change the type of input-element: 'password' or 'text'
const chgInputType = (id, self) => {
	// "id" is supposed to be of an "input" element.
	// "self" is the element where this function is set.
	const input = document.getElementById(id)
	if(input.type === 'password'){
		input.type = 'text'
		self.value = 'パスワードを非表示'
	}else{
		input.type = 'password'
		self.value = 'パスワードを表示'
	}
	input.focus()
}



// Make forms
// "tgtCid" works when ph === 'modAdmAppForm'.
const makeForms = (ph, tgtCid = 0) => {
	curCid = tgtCid
	phase = ph
	// Here, the global "typs" is for the case: typs === 'aa'.
	fI.pastPt = createFiPastPt(typs)
	// The following strings or arrays are empty by default.
	let htPhase = ''
	let htFormItems = ''
	let htMessage = ''
	let htGuide = ''
	let forgotPassword = ''
	reqdText = [], reqdTextPlus = []
	// Determine "htFormItems", etc. according to "ph".
	if(ph === 'regEmailForm'){
		reqdText = ['email']
		htPhase = `<span style='font-size: 0.6em; line-height: 2.2'>はじめに </span><br>メールアドレス登録<br><span style='font-size: 0.6em'> をお願いします！</span>`
		//htFormItems = fI.email
		htFormItems = fI.email
		htGuide = `<span class='bold font11 red'>最初に当サーバからのメールを受信できることをご確認いただきます。<br><br>
		利用者（＝保護者）の本登録はそのメールでお受け取りになった URL から行っていただきます。</span><br><br>下欄にメールアドレスを入力して［送信］ボタンを押してください。<br><br>尚、ここで登録されたメールアドレスは、当園の${typs === 'aa'? "入園出願，": (typs === 'pr'? "一時預かり保育（一般型）『スマイル』，": "")}子育て支援プログラムご予約の際のログインIDとなります。`
		forgotPassword = ''
	}else if(ph === 'loginForm'){
		if(uid){
			reqdText = ['pw']
			htFormItems = fI.pw
		}else{
		//console.log('PHASE: ' + ph + ', In the step to make "htFormItems"')//★★ LOG ★★
			reqdText = ['email', 'pw']
			htFormItems = fI.email + fI.pw
		}
		htPhase = 'ログイン'
	}else if(ph === 'chgEmailForm'){
		reqdText = ['newEmail']
		htPhase = 'メールアドレス変更'
		htFormItems = `現在のメールアドレス: ${user.email}${fI.newEmail}`
		htGuide = ''
	}else if(ph === 'chgPwForm'){
		reqdText = ['pw', 'newPw']
		htPhase = 'パスワード変更'
		htFormItems = fI.pw + fI.newPw
		htGuide = ''
	}else if(ph === 'resetPwForm'){
		reqdText = ['newPw']
		htPhase = 'パスワード・リセット'
		htFormItems = fI.newPw
		htGuide = '新しいパスワードを設定してください。'
	}else if(ph === 'regUserForm' || ph === 'modUserForm'){
		// When ph === 'regUserForm', items about "newPw" are added.
		reqdText= [...(ph === 'regUserForm'? ['newPw']: []), ...['ulname', 'ufname', 'ulname_k', 'ufname_k', 'zipcode', 'prefecture', 'cityarea', 'street', 'uphone', 'scharea']]
		reqdTextPlus = ['hlname', 'hfname', 'hlname_k', 'hfname_k']
		htPhase = ph === 'regUserForm'? '利用者登録': '利用者情報の確認・変更'
		//htFormItems = (ph === 'regUserForm'? fI.newPw: '') + fI.usrName + fI.hohName + fI.address + fI.uphone + fI.hphone + fI.schArea + fI.schAreaPlus
		htFormItems = (ph === 'regUserForm'? fI.newPw: '') + fI.user + fI.hoh + fI.address + fI.schArea + fI.schAreaPlus
		htGuide = ph === 'regUserForm'? `各項目に入力して［送信］してください（${AST}印：必須）。`: '必要箇所を変更して［送信］してください。'
	}else if(ph === 'addChildForm'){
		reqdText = ['clname', 'cfname', 'clname_k', 'cfname_k', 'cbirth']
		htPhase = '子ども情報の追加'
		htFormItems = fI.cName + fI.cBirth + fI.cSex + fI.pastPt
		elem.report.innerHTML = ''
		elem.message.innerHTML = ''
	}else if(ph === 'modChildForm'){
		reqdText = ['clname', 'cfname', 'clname_k', 'cfname_k', 'cbirth']
		htPhase = '子ども情報の確認・変更'
		htFormItems = fI.cId + fI.cName + fI.cBirth + fI.cSex + fI.pastPt
		htFormItems += "<div id='btnCfmDelChild' class='outrDelChildInfo'></div><br>"
	}else if(ph === 'modAdmAppForm'){// modify admission application screen.
		htMessage = `<span class='font10'>　「出願情報の登録」は、市に提出する「子どものための教育・保育給付認定申請書」に必要な項目（世帯の状況等）および当園への「入園願書」の項目（写真等）を合わせた内容となっています。漏れなくご入力ください。</span>`
		htPhase = '出願情報の登録'
		htFormItems = fI.famState + fI.portrait
	}else if(ph === 'start'){
		htPhase = `ようこそ<span style='font-style: italic;'>!!</span>`
		htFormItems = ''
		if(email.length){
			htGuide = `ログインしてください。`
		}else{
			htGuide = `初めてご利用の方はメールアドレス登録からお願いします！<br><span class='font08 crimson'>メールアドレス登録に続いて利用者登録（本登録）を頂きます。</span>`
			//htGuide += typs === 'aa'? "<br><span class='bold font09 red'>2021年度入園出願予約（10月1日）をご予定の皆さまへ<ul class='ul01'><li>入園出願予約には当園「子育て支援プログラム」の利用者登録が必要です。まだの方はここからご登録ください。</li><li>既に「子育て支援プログラム」利用者登録のある方は、改めてのご登録は不要です。ログインできることを確認しておいてください。</li></ul></span>": ""
			htGuide += `<button class='full regEmailForm' onClick='makeForms("regEmailForm")'>利用者登録（メールアドレス登録）へ</button><br><br><br>利用者登録済みの方は次のいずれかの方法でログインしてください。<br>（１）利用者登録完了時にメール受信しているログインURLから<br>（２）下のログインフォームから`
		}
	}

	// Add the class for color to elem.phaseTitle.
	elem.phaseTitle.style.color = (typs === 'aa'? 'hotpink': (typs === 'pr'? 'royalblue': 'forestgreen'))

	// Render every HTML contents.
	if(!['start', 'regEmailForm', 'regUserForm', 'loginForm', 'resetPwForm'].includes(ph)){
		const strUserLFName = !user? '利用者： ' + user.ulname + ' ' + user.ufname + ' さま': ''
		elem.userLFName.innerHTML = strUserLFName
		elem.btnBackward.innerHTML = `<button class='backward' onClick='returnHome("${htGuide}")'>戻る</button>`
	}
	elem.phaseTitle.innerHTML = htPhase
	elem.evtSchedule.innerHTML = ''
	elem.report.innerHTML = ''
	elem.message.innerHTML = htMessage
	elem.guide.innerHTML = htGuide
	elem.forms.innerHTML = htFormItems
	if(ph !== 'modAdmAppForm') elem.main.innerHTML = ''
	elem.footer.innerHTML = ''

	// At this point, the DOM has been rendered once. Therefore, the methods of the DOM (getElementById, addEventListener, etc.) can be used.
	if(ph === 'start'){
		// Guidance to other parts(aa, pr, ccs-events)
		const urlCcs = chgTypsValue(location.href, '')
		const urlAd = chgTypsValue(location.href, 'aa')
		const urlPr = chgTypsValue(location.href, 'pr')
		let htGuideToChangeClass = ''
		const TO_CCS = `<div class='toOtherTyps'><span class='bold font07 ccs'>↓ 子育て支援プログラム予約はこちらから</span><br><button class='full toCcs' onClick='location.href="${urlCcs}"'>子育て支援プログラム予約</button></div>`
		const TO_PR = `<div class='toOtherTyps'><span class='bold font07 pr'>↓ 一時預かり保育（一般型）『スマイル』入会予約はこちらから</span><br><button class='full toPr' onClick='location.href="${urlPr}"'>一時預かり保育（一般型）『スマイル』入会予約</button></div>`
		const TO_AA = `<div class='toOtherTyps'><span class='bold font07 aa'>↓ 入園出願予約はこちらから</span><br><button class='full toAd' onClick='location.href="${urlAd}"'>入園出願予約</button></div>`
		if(typs === 'aa'){// Admission Application
			htGuideToChangeClass = TO_CCS + TO_PR
		}else if(typs === 'pr'){// Pre-KG (Smile and Smile Jr.)
			elem.phaseTitle.style.fontSize = '1.0em;'
			htGuideToChangeClass = TO_CCS + TO_AA
		}else{// Others (CCS Events)
			elem.phaseTitle.style.fontSize = '1.4em;'
			htGuideToChangeClass = TO_AA + TO_PR
		}
		elem.chgClass.innerHTML = htGuideToChangeClass
		elem.buttons.innerHTML = `<button class='full login' onClick='makeForms("loginForm");'>ログインフォームへ</button>`
	}else if(ph === 'loginForm'){
		elem.footer.innerHTML = guidePwReset
	}else if(ph === 'chgEmailForm'){
		document.getElementById('strEmail').innerHTML = '新しいメールアドレス'
	}else if(ph === 'chgPwForm'){
		document.getElementById('strPw').innerHTML = '現在のパスワード'
		document.getElementById('strNewPw').innerHTML = '新しいパスワード'
	}else if(ph === 'regUserForm' || ph === 'modUserForm'){
		document.getElementById('hohEqUsr').addEventListener('change', function(e){
			// When the checkbox is unchecked, the inputs (names and phone) are also reset.
			if(this.checked) this.parentElement.querySelectorAll('input[type=text]').forEach(el => el.value = '')
			// And, make their visibility hidden.
			document.getElementById('hohForm').style.visibility = this.checked? 'collapse': 'visible'
		})
	}else if(ph === 'addChildForm'){
		// pastpt is set to ['ft'] for a new child.
		document.getElementsByName('pastpt')[0].checked = true
	}else if(ph === 'modChildForm'){
		//elem.main.style.display = 'none'
	}else if(ph === 'modAdmAppForm'){
		turnOnOffDisplay(['forms'], ['main'])
		parseAdmAppForm(tgtCid)
	}else if(ph.match(/Form$/)){
		elem.report.innerHTML = ''
	}else{
		if(!noDBSQ) dBDF()
	}
	if(ph === 'addChildForm') scrollTo("phaseTitle")
}





/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■ */
/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■ */
/* ■□■□■□■□■□■□ Admission Application □■□■□■□■□■□■ */

const parseAdmAppForm = (tgtCid) => {
	// Get the object of child data from chnResvs[tgtCid] which is the same as a specific record in the children table.
	const c = chnResvs[tgtCid].child

	// Display the target child name.
	document.getElementById('famStateHeader').innerHTML = `出願児童 <span class='bold font10 crimson'>${c.clname}${c.cfname}</span><span class='font09'> さまに係る</span><br><span class='bold font17'>世帯の状況</span>`

	parseFamMembers(tgtCid)
}



// Turn on and off the displays of elements of given ids.
const turnOnOffDisplay = (idsToTurnOn, idsToTurnOff) => {
	for(let id of idsToTurnOn){
		const el = document.getElementById(id)
		if(el){
			el.style.visibility = 'visible'
			el.style.height = 'auto'
		}
	}
	for(let id of idsToTurnOff){
		const el = document.getElementById(id)
		if(el){
			el.style.visibility = 'hidden'
			el.style.height = '0px'
		}
	}
}



/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□ */
/* ■□■□■□■□■□■□■□ Family Members □■□■□■□■□■□■□■ */

// ＊＊＊＊＊ Functions for general use of cookie ＊＊＊＊＊

// Get and (JSON)decode an object from the cookie.
const getObjectFromCookie = (cookieKey) => {
	const foundByKey = document.cookie.split('; ').find(v => v.startsWith(cookieKey))
	return foundByKey? JSON.parse(foundByKey.split('=')[1]): null
}

// Encode(JSON) an object and add it to the array of cookie.
const setObjectIntoCookie = (obj, cookieKey, expDays) => {
	//const expMSec = (new Date((new Date()).getTime() + expSecs * 1000)).toUTCString()// 
	const expMSec = (new Date()).getTime() + expDays * 86400 * 1000
	// Make "obj" JSON-encoded and set it into the cookie with key "cookieKey".
	document.cookie = `${cookieKey}=${JSON.stringify(obj)}; expires=${expMSec}`
}

// The following function will delete all cookies in "sec" seconds. 
const resetAllCookies = (expSec) => {
	//const objCookie = document.cookie.split('; ').reduce((a, v) => (a[v.split('=')[0]] = v.split('=')[1], a), {})
	const expMSec = (new Date((new Date()).getTime() + expSec * 1000)).toUTCString()
	const cookieKeys = document.cookie.split('; ').map(v => v.split('=')[0])
	for(let key of cookieKeys){
		document.cookie = `${key}=; expires=${expMSec}`
	}
}



// Set the FamMember input.values into the cookie.
const setFamMemberIntoCookie =function(e){
	setObjectIntoCookie(getFmInpValues(FM_IDS_INP), 'famMember', EXP_DAYS)
	dspBtnUpdFamMembers()
}
const setFM2C = setFamMemberIntoCookie// for shortening.




// For debug.
const dspState = (ids) => {
	for(id of ids){
		const el = document.getElementById(id)
		console.log(`${id}: ${el.style.visibility}, ${el.style.height}`)
	}
}



/* ■□■□■□■□■□ Family members and their forms □■□■□■□■□■ */

// The followings are for family members. "Rs" stands for "Relationship".
// "FM_IDS" consists of full id's for famMembers. However, this is rarely used.
const FM_IDS = ['uid', 'cid', 'fmLname', 'fmFname', 'fmLname_k', 'fmFname_k', 'fmBirth', 'fmSex', 'fmRs', 'fmRsStr', 'fmHoh', 'fmSmile', 'fmEnroll', 'fmGrad', 'fmPhone', 'fmIniChk']

// "FM_IDS_INP" is impourtant for various processes.
const FM_IDS_INP = ['fmLname', 'fmFname', 'fmLname_k', 'fmFname_k', 'fmBirth', 'fmSex', 'fmRs', 'fmRsStr', 'fmHoh', 'fmSmile', 'fmEnroll', 'fmGrad', 'fmPhone', 'fmIniChk']

// FamMember id's except for input[type=checkbox]
const FM_IDS_REQ = ['fmLname', 'fmFname', 'fmLname_k', 'fmFname_k', 'fmBirth', 'fmSex', 'fmRs', 'fmIniChk']

// Discription of fmSex and fmRs. We save the keys as values.
// "neu" means "neutral".
const FM_SEX = {neu: '選択してください', f: '女', m: '男'}
const FM_RS = {neu: '選択してください', par: '父母', gp: '祖父母', sib: '兄弟姉妹（含本人）', oths: 'その他（直接入力）'}

// Expiration days for cookie.
const EXP_DAYS = 1



// Initialize the array of objects: "famMembers".
const initFamMembers = () => {
	if(!famMembers) famMembers = []
	// This function works only when the length of the array is zero.
	if(famMembers.length) return false

	// First, add the "user".
	famMembers.push({uid: user.uid, cid: 0, fmLname: user.ulname, fmFname: user.ufname, fmLname_k: user.ulname_k, fmFname_k: user.ufname_k, fmBirth: '', fmSex: '', fmRs: '', fmHoh: (+user.hohequsr === 1), fmSmile: 0, fmEnroll: 0, fmGrad: 0, fmPhone: user.uphone, fmIniChk: 0})

	// Next, if the head of household is different from the user, add it.
	if(!+user.hohequsr){
		famMembers.push({uid: user.uid, cid: 0, fmLname: user.hlname, fmFname: user.hfname, fmLname_k: user.hlname_k, fmFname_k: user.hfname_k, fmBirth: '', fmSex: '', fmRs: '', fmHoh: 1, fmSmile: 0, fmEnroll: 0, fmGrad: 0, fmPhone: user.hphone, fmIniChk: 0})
	}

	// And add all of their children (who in this case fall under "chilrenExt"). 
	for(let i = 0, len = childrenExt.length; i < len; i++){
		// For fmGrad, this is determined based on c.entdate not being NULL and the number of years elapsed between schBY(c.cbirth) and CUR_FY. We dare not rely on c.graddate. Because c.garddate is incomplete and c.gradate is impossible without c.entdate.
		let fmEnroll = 0, fmGrad = 0
		const c = childrenExt[i]
		if(c.entdate){
			if(schBY(c.cbirth) + 6 < CUR_FY){
				fmGrad = 1
			}else{
				fmEnroll = 1
			}
		}
		famMembers.push({uid: user.uid, cid: c.cid, fmLname: c.clname, fmFname: c.cfname, fmLname_k: c.clname_k, fmFname_k: c.cfname_k, fmBirth: c.cbirth.replace(/\s\d{2}:\d{2}:\d{2}/, ''), fmSex: c.csex, fmRs: 'sib', fmHoh: 0, fmSmile: 0, fmEnroll: fmEnroll, fmGrad: fmGrad, fmPhone: '', fmIniChk: 0})
	}
}



// Prarsing the state of famMembers, do either "setFmForm" or "dspFamMembers".
const parseFamMembers = (tgtCid) => {
	turnOnOffDisplay([], ['parFamRelForm', 'parFamRel', 'parPortraitCtrl'])
	for(let i = 0, len = famMembers.length; i < len; i++){
		let blanks = 0
		for(id of FM_IDS_REQ){
			if(id === 'fmIniChk'){// famMembers[i][v] is Boolean.
				blanks += !+famMembers[i][id]
			}else{// famMembers[i][v] is a string.
				blanks += !famMembers[i][id].length? 1: 0
			}
		}
		if(blanks){// undIniConstr (Under Initial Construction) is to be set to true when the blanks is positive.
			turnOnOffDisplay(['parFamMemberForm'], ['parFamMembers'])
			const fm = famMembers[i]
			const msg = `<div'>
				<div class='font12'>★家族構成の追加・編集</div>
				<div class='msg'>ここでは、<span class='crimson'>当予約システムに現在登録されている利用者さま、お子さま或いは過去に登録されていてその後入園されたお子さまについて、既存情報を入力した形で以下に表示</span>しております。<br><br>先ずはこれらの方々について、内容をご確認の上、家族構成への追加をお願いいたします<span class='font08 royalblue'>（後から内容の修正や家族の削除は可能です）</span>。<br><br>下記の <span class='crimson'>${fm.fmLname} ${fm.fmFname}</span> さまについて、${+fm.cid? `<span class='crimson'>チェック項目等をご確認</span>の上、`: '以下の未入力項目を入力してから'}「家族構成」に［追加］してください<span class='font08 royalblue'>（必須項目が埋まると［追加］ボタンが表示されます）</span>。</div>
			</div>`
			document.getElementById('famMemberFormHeader').innerHTML = msg

			setFmForm(i, tgtCid, true)// the 3rd param "true" means it is "under initial construction" (ref. setMemberForm).
			return false
		}
	}
	document.getElementById('famMemberFormHeader').innerHTML = ''
	turnOnOffDisplay(['parFamMembers'], ['parFamMemberForm'])
	dspFamMembers(tgtCid)
	parseFamRel(tgtCid)
}



// Followings are the preparation for "setFmForm" and "dspFamMembers".

// Get fm input values with keys in "ids".
const getFmInpValues = (ids) => {
	const inpVals = {}
	for(let id of ids){
		const el = document.getElementById(id)
		if(el.tagName === 'INPUT'){
			if(el.type === 'text'){
				inpVals[id] = el.value// string
			}else if(el.type === 'checkbox'){
				inpVals[id] = +el.checked// boolean
			}
		}else if(el.tagName === 'SELECT'){
			inpVals[id] = el.value
		}else if(id === 'fmBirth'){
			const chn = el.children// this "children" is the property in DOM.
			inpVals[id] = `${chn[0].value}-${p02d(chn[1].value)}-${p02d(chn[2].value)}`
		}else if(id === 'fmRsStr'){
			const elFmRsInp = document.getElementById('fmRsInp')
			// If the input element exists, take its value, othrewise, null.
			inpVals[id] = elFmRsInp? elFmRsInp.value: null
		}
	}
	return inpVals
}



// Checking whether the required form-items are already filled or not.
const isFmFormFilled = (idsReqd) => {
	if(idsReqd){
		for(let id of idsReqd){
			const el = document.getElementById(id)
			if(el.tagName === 'INPUT'){
				if(el.type === 'text' && !el.value.length) return false
				// For now, el.type === 'checkbox' means id === 'fmIniChk'.
				if(el.type === 'checkbox' && !el.checked) return false
			}
			if(id === 'fmBirth' && [0, 1, 2].map(v => el.children[v].value).includes('0')) return false
			if(id === 'fmSex' && el.value === 'neu') return false
			if(id === 'fmRs'){
				if(el.value === 'neu') return false
				if(el.value === 'oths'){
					const elFmRsInp = document.getElementById('fmRsInp')
					if(elFmRsInp !== null && !elFmRsInp.value.length) return false
				}
			}
		}
	}
	return true
}



// Check famMmeber inputs. abbreviated as "dBUFM"
const dspBtnUpdFamMembers = () => {
	// Remark that "isPhoneValid" allows empty.
	if(isFmFormFilled(FM_IDS_REQ) && isPhoneValid(document.getElementById('fmPhone').value)){
		document.getElementById('updFamMembers').style.display = 'block'
	}else{
		document.getElementById('updFamMembers').style.display = 'none'
	}
}
const dBUFM = dspBtnUpdFamMembers



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



// Display fmRsStr (fm-Relationship-String) on the right side of select-element.
const dspFmRsStr = function(){
	const elFmRsStr = document.getElementById('fmRsStr')
	elFmRsStr.style.width = '4rem'
	const tgt = chnResvs[curCid].child
	let dsp = ''
	const vals = getFmInpValues(['fmBirth', 'fmSex', 'fmRs'])
	if(vals.fmRs === 'oths'){
		elFmRsStr.style.width = '9rem'
		dsp = `<input id='fmRsInp' type='text' value='' onInput='dBUFM()' placeholder='ご入力ください！'>`
	}else{
		dsp = getRsStr(vals.fmBirth, vals.fmSex, vals.fmRs, tgt.cbirth)
	}
	elFmRsStr.innerHTML = dsp
	dBUFM()// necessary!
}
const dFRS = dspFmRsStr// for shortening.



// Display (or not display) the items (enroll, grad, hoh, phone) by the age of the member whose form is now being filled out and by the "tgtBirth".
const dspItemsByAgeEtc = (tgtBirth) => {
	// The following values are of the person whose data is now beeing filled on the form (not the target child).
	const bYear = +document.getElementById('fmBYear').value
	const bMonth = +document.getElementById('fmBMonth').value
	const bDate = +document.getElementById('fmBDate').value
	if(!bYear || !bMonth || !bDate) return
	const numBirth = 10000 * bYear + 100 * bMonth + bDate
	// "ageLA1" is the "age at the last Apr 1st"(= age at the begining day of current FY).
	const ageLA1 = Math.floor((NUM_LAST_APR1 - numBirth) / 10000)
	document.getElementById('hWrapFmSmile').style.display = (0 < ageLA1 && ageLA1 < 3)? 'block': 'none'
	//document.getElementById('smileClass').innerText = ageLA1 === 1? 'ひよこ': (ageLA1 === 2? 'こあら': '')
	document.getElementById('hWrapFmEnroll').style.display = ageLA1 < 6? 'block': 'none'
	document.getElementById('hWrapFmGrad').style.display = ageLA1 >= 6? 'block': 'none'
	document.getElementById('hWrapFmHoh').style.display = ageLA1 >= 20? 'block': 'none'
	document.getElementById('hWrapFmPhone').style.display = ageLA1 >= 20? 'block': 'none'
	// When the person is the target child, fmEnroll checkbox should not be displayed.
	if(`${bYear}-${p02d(bMonth)}-${p02d(bDate)}` === tgtBirth) document.getElementById('hWrapFmEnroll').style.display = 'none'
}
const dIBAE = dspItemsByAgeEtc// for shortening.



// Setting the form to enter the date in year, month and day.
// It is assumed that the DOM has select elements and their first options for year, month, and date. And the parameter "selYmd" means "selected Ymd".
const setYmdForm = (selYmd) => {
	const elFmBYear = document.getElementById('fmBYear')
	const elFmBMonth = document.getElementById('fmBMonth')

	// When "selYmd" has a correct format, year, month and day are obtained from (new Data(selYmd)). Otherwise, year, mointh and day are all set to 0s.
	let selY, selM, selD
	if(selYmd.match(/\d{4}-\d{2}-\d{2}/)){
		const selDt = new Date(selYmd)
		// sleM takes one of {1, 2, ..., 12}.
		selY = selDt.getFullYear(), selM = selDt.getMonth() + 1, selD = selDt.getDate()
	}else{
		selY = selM = selD = 0
	}

	const curY = (new Date()).getFullYear()
	for(let i = curY; i >= 1900; i--){
		elFmBYear.insertAdjacentHTML('beforeend', `<option value='${i}'${i === selY? ' selected': ''}>${i}</option>`)
	}
	for(let i = 1; i <= 12; i++){
		elFmBMonth.insertAdjacentHTML('beforeend', `<option value='${i}'${i === selM? ' selected': ''}>${i}</option>`)
	}
	// "fmBDate" form is set by the separate function "setDateForm".
	setDateForm(selY, selM, selD)

	// Add event listeners.
	// Remark that in the followings, mVal is the month-order (0, 1, ... or 11).
	elFmBYear.addEventListener('change', function(){
		const yVal = +document.getElementById('fmBYear').value
		const mVal = +document.getElementById('fmBMonth').value
		if(yVal && mVal) setDateForm(yVal, mVal, selD)
		dFRS()
	})
	elFmBMonth.addEventListener('change', function(){
		const yVal = +document.getElementById('fmBYear').value
		const mVal = +document.getElementById('fmBMonth').value
		if(yVal && mVal) setDateForm(yVal, mVal, selD)
		dFRS()
	})
}



// Setting the form to enter date (a day in the Y-m).
// It is assumed that the select element and its first option have already been rendered.
// "selDate" means "currently selected date(the very date)".
// Note that "month" is the month-order (0, 1, ... or 11) in jsvascript.
const setDateForm = (year, month, selDate) => {
	const elFmDate = document.getElementById('fmBDate')
	// Use that Date(y, m, 0) is the last date of the previous month of y-(m - 1). 
	const days = (new Date(year, month, 0)).getDate()
	elFmDate.innerHTML = `<option value='0'>--</option>`
	for(let i = 1; i <= days ; i++){
		elFmDate.insertAdjacentHTML('beforeend', `<option value='${i}'${i === selDate? ' selected': ''}>${i}</option>`)
	}
}



// Create the Family-Member-Form (Html) to edit or add a member.
// "tgtCid" is the cid of the target child.
// "undIniConstr" stands for "under Initial Construction" which means that all required fields for parents and children have not been filled in yet.
// "undIniConstr" (boolean) helps when the form is cancelled. Depending on whether "undIniConstr" is true or false, the screen will return to a different destination upon cancellation.
const createFmFormHtml = (fmIdx, tgtCid, undIniConstr) => {
	// When fmIdx === famMembers.length, the form is for adding a new member and then we must prepare the initial family-member object with void or false fields. Otherwise (i.e. fmIdx < famMembers.length), the form is for editing the existing member (fam_member[fmIdx]).

	let fm// to be the target family-member-object.
	// The following initial values are for the case of "adding new".
	let labBtnUpdate = '追加'
	let btnDelete = ''
	let isAddingNew = false
	if(fmIdx === famMembers.length){// i.e. fmIdx is a new index.
		isAddingNew = true
		const fmIdsWithValues = ['fmLname', 'fmFname', 'fmLname_k', 'fmFname_k', 'fmBirth', 'fmSex', 'fmRs', 'fmPhone']// for input[type=text] or select elements
		const fmOtherIds = ['fmHoh', 'fmEnroll', 'fmGrad']// for input[type=checkbox]
		fm = famMembers[fmIdx] = {...fmIdsWithValues.reduce((a, v) => (a[v] = '', a), {}), ...fmOtherIds.reduce((a, v) => (a[v] = false, a), {})}
	}else if(fmIdx < famMembers.length){
		fm = famMembers[fmIdx]
		if(!undIniConstr){
			labBtnUpdate = '更新'
			btnDelete = `<button id='delFamMember' class='delete' data-tgt-cid='${tgtCid}' data-fm-idx='${fmIdx}'><span style='vertical-align: middle;'>×削除</span></button>`
		}
	}

	// Prepare options.
	const sexOpts = Object.keys(FM_SEX).reduce((a, v) => (a += `<option value='${v}' ${fm.fmSex === v? ' selected': ''}>${FM_SEX[v]}</option>`), '')
	const rsOpts = Object.keys(FM_RS).reduce((a, v) => (a += `<option value='${v}' ${fm.fmRs === v? ' selected': ''}>${FM_RS[v]}</option>`), '')
	// Prepare buttons for cancel and update.
	const btnCancel = `<button id='cancelFmForm' class='cancel' data-tgt-cid='${tgtCid}' data-fm-idx='${fmIdx}' data-und-ini-constr='${undIniConstr}' data-is-adding-new='${isAddingNew}'><span style='vertical-align: middle;'>キャンセル</span></button>`
	const btnUpdate = `<button id='updFamMembers' class='update' data-tgt-cid='${tgtCid}' data-fm-idx='${fmIdx}'><span style='vertical-align: middle;'>${labBtnUpdate}</span></button>`

	const tgtBirth = chnResvs[tgtCid].child.cbirth.replace(/\s\d{2}:\d{2}:\d{2}/, '')
	const smileClass = CUR_FY - schBY(fm.fmBirth) === 3? 'こあら': (CUR_FY - schBY(fm.fmBirth) === 2? 'ひよこ': '')

	// Html of Family-Member-Form
	const fmFormHtml = `<div class='fmForm'>
		<div class='hWrap'>
			<div class='fmNames'>
				<div class='ttl'>姓</div>
				<input id='fmLname' type='text' value='${fm.fmLname}' onInput='dBUFM()'>
			</div>
			<div class='fmNames'>
				<div class='ttl'>名</div>
				<input id='fmFname' type='text' value='${fm.fmFname}' onInput='dBUFM()'>
			</div>
		</div>
		<div class='hWrap'>
			<div class='fmNames'>
				<div class='ttl'>せい<span class='font08'>（ひらがな）</span></div>
				<input id='fmLname_k' type='text' value='${fm.fmLname_k}' onInput='dBUFM()'>
			</div>
			<div class='fmNames'>
				<div class='ttl'>めい<span class='font08'>（ひらがな）</span></div>
				<input id='fmFname_k' type='text' value='${fm.fmFname_k}' onInput='dBUFM()'>
			</div>
		</div>
		<div class='hWrap'>
			<div class='fmBirth'>
				<div class='ttl'>生年月日</div>
				<div id='fmBirth'>
					<select id='fmBYear' onInput='dBUFM(); dIBAE(${tgtBirth})'><option value='0'>--</option></select>年&nbsp;
					<select id='fmBMonth' onInput='dBUFM(); dIBAE(${tgtBirth})'><option value='0'>--</option></select>月&nbsp;
					<select id='fmBDate' onInput='dBUFM(); dIBAE(${tgtBirth})'><option value='0'>--</option></select>日&nbsp;
				</div>
			</div>
		</div>
		<div class='hWrap'>
			<div class='fmSex'>
				<div class='ttl'>性別</div>
				<select id='fmSex' value='' onInput='dBUFM()' onChange='dFRS()'>${sexOpts}</select>
			</div>
		</div>
		<div class='hWrap'>
			<div class='fmRsWrap'>
				<div class='ttl'>出願児童との関係</div>
				<select id='fmRs' value='' onInput='dBUFM()' onChange='dFRS()'>${rsOpts}</select>
			</div>
			<div class='fmRsStrWrap'>
				<div class='ttl'>続柄</div>
				<div id='fmRsStr'>${getRsStr(fm.fmBirth, fm.fmSex, tgtBirth)}</div>
			</div>
		</div>
		<div id='hWrapFmHoh' class='hWrap byAge'>
			<div class='outrChkBox'>
				<div class='ttl'>この方は世帯主ですか？</div>
				&nbsp;<input id='fmHoh' type='checkbox' ${+fm.fmHoh? "checked": ""} onInput='dBUFM()'>世帯主
			</div>
		</div>
		<div id='hWrapFmSmile' class='hWrap byAge'>
			<div class='outrChkBox'>
				<div class='ttl'>この方は現在、当園『スマイル（${smileClass}）』に入会中ですか？</div>
				&nbsp;<input id='fmSmile' type='checkbox' ${+fm.fmSmile? "checked": ""} onInput='dBUFM()'>『スマイル（${smileClass}）』入会中
			</div>
		</div>
		<div id='hWrapFmEnroll' class='hWrap byAge'>
			<div class='outrChkBox'>
				<div class='ttl'>この方は現在、当園に在園中ですか？</div>
				&nbsp;<input id='fmEnroll' type='checkbox' ${+fm.fmEnroll? "checked": ""} onInput='dBUFM()'>在園中
			</div>
		</div>
		<div id='hWrapFmGrad' class='hWrap byAge'>
			<div class='outrChkBox'>
				<div class='ttl'>この方は当幼稚園の卒園者ですか？</div>
				&nbsp;<input id='fmGrad' type='checkbox' ${+fm.fmGrad? "checked": ""} onInput='dBUFM()'>卒園者
			</div>
		</div>
		<div id='hWrapFmPhone' class='hWrap byAge'>
			<div class='fmPhone'>
				<div class='ttl'>電話番号<span class='font08'>（連絡を受ける方は必ずご入力ください）</span></div>
				<input id='fmPhone' type='text' value='${fm.fmPhone}' onInput='chkPhone(this); dBUFM()'><br><span id='msg_fmPhone' class='font08 palevioletred'></span>
			</div>
		</div>
		<div id='hWrapFmIniChk' class='hWrap'>
			<div class='outrChkBox'>
				<div class='ttl'>この方について以上の内容で OK ですか？</div>
				&nbsp;<input id='fmIniChk' type='checkbox' ${+fm.fmIniChk? "checked": ""} onInput='dBUFM()'> OK<span class='font08 hotpink'>（後からも内容の修正は可能です）</span>
			</div>
		</div>
		${btnCancel}
		${btnUpdate}
		${btnDelete}
	</div>`
	return fmFormHtml
}



// Set a form for the family-member: famMembers[fmIdx].
// "isFmTemp" means "Is the famMembers temporary?". When isFmTemp === true, the temporary fm will be reset at the timing of "cancel" . And it should be true only when adding regd-user.
const setFmForm = (fmIdx, tgtCid, undIniConstr) => {
	document.getElementById('famMemberForm').innerHTML = '家族構成の追加・編集'
	const elFamMemberForm = document.getElementById('famMemberForm')
	elFamMemberForm.innerHTML = createFmFormHtml(fmIdx, tgtCid, undIniConstr)

	// Set Ymd-form for the date of birth.
	// famMembers[fmIdx].fmBirth is of the form 'yyyy-mm-dd( HH:MM:SS)' or an empty string.
	setYmdForm(famMembers[fmIdx].fmBirth)

	// Forms for fmSmile, fmEnroll and fmGrad are prevented from being displayed simultaneously by "dspItemsByAgeEtc". However, there is a danger that their values (checked or not) will be "true" at the same time, since the birthdate can be changed. So if any of the three are checked, the other two check should be off.
	for(let x of ['fmSmile', 'fmEnroll', 'fmGrad']){
		document.getElementById(x).addEventListener('change', function(e){
			if(e.currentTarget.checked){
				for(let y of ['fmSmile', 'fmEnroll', 'fmGrad']){
					if(y === x) continue
					document.getElementById(y).checked = false
				}
			}
		})
	}

	// Add event-listeners.
	// Cancel
	document.getElementById('cancelFmForm').addEventListener('click', function(e){
		// First, destroy the form.
		document.getElementById('famMemberForm').innerHTML = ''

		const elFamMembers = document.getElementById('famMembers')
		const undIniConstr = e.currentTarget.dataset.undIniConstr
		//const fmIdx = +e.currentTarget.dataset.fmIdx
		const isAddingNew = e.currentTarget.dataset.isAddingNew
		// Remark this undIniConstr and isAddingNew are both strings (taking 'true' or 'false').
		if(undIniConstr === 'true'){
			// Delete the display of famMembers.
			elFamMembers.innerHTML = ''
			// Go back to 「登録・予約状況」
			turnOnOffDisplay([], ['parFamMembers', 'parFamMemberForm'])
			turnOnOffDisplay(['main'], ['forms'])
			//elem.forms.style.display = 'none'
			//elem.main.style.display = 'block'
			elem.phaseTitle.innerHTML = '登録・予約状況'
			elem.message.innerHTML = ''
		}else{
			// If the form was for "adding new member", unfinished data (the last element of famMembers) must be deleted.
			if(isAddingNew === 'true') famMembers.pop()
			// Turn on the display of famMembers.
			//turnOnOffDisplay(['parFamMemberForm'], ['parFamMembers'])
			turnOnOffDisplay(['parFamMembers'], ['parFamMemberForm'])
		}
	})

	// Update　Since the "famMembers" is initialized to an empty array [], addition is a type of update.
	document.getElementById('updFamMembers').addEventListener('click', function(e){
		const tgtCid = +e.currentTarget.dataset.tgtCid
		const fmIdx = +e.currentTarget.dataset.fmIdx
		// We add or update famMembers[idx] with values of inputs.
		//famMembers[fmIdx] = getFmInpValues(FM_IDS_INP)
		for(let id of FM_IDS_INP) famMembers[fmIdx][id] = getFmInpValues(FM_IDS_INP)[id]
		// Sorting the new famMembers by date of birth in ascending order.
		famMembers = famMembers.sort((v, w) => v.fmBirth < w.fmBirth? -1: 1)
		// Exceute "doFetch"
		doFetch('updFamState', {cid: tgtCid})
	})

	// Delete when the form is for editing an existing member (i.e. the element is not null).
	const elDelFamMember = document.getElementById('delFamMember')
	if(elDelFamMember){
		elDelFamMember.addEventListener('click', function(e){
			const tgtCid = +e.currentTarget.dataset.tgtCid
			const fmIdx = +e.currentTarget.dataset.fmIdx
			// Remove the member from famMembers.
			famMembers[fmIdx] = null
			famMembers = famMembers.filter(Boolean)
			// Execute "doFetch"
			doFetch('updFamState', {cid: tgtCid})
		})
	}
	// Once do dBUFM, dIBAE.
	const tgtBirth = chnResvs[tgtCid].child.cbirth.replace(/\s\d{2}:\d{2}:\d{2}/, '')
	dBUFM()
	dIBAE(tgtBirth)
	dFRS()
}



// Create a html of Family Member Card for a member.
// tgtCid is the cid of the target child.
const createFmCardHtml = (fmIdx, tgtCid) => {
	const tgtBirth = chnResvs[tgtCid].child.cbirth
	const fm = famMembers[fmIdx]
	const smileClass = CUR_FY - schBY(fm.fmBirth) === 3? 'こあら': (CUR_FY - schBY(fm.fmBirth) === 2? 'ひよこ': '')
	const fmCardHtml = `<div id='fm_${fmIdx}' class='fmCard'>
		<div class='lfnames'><span class='lfnameLarge'>${fm.fmLname}&nbsp;&nbsp;${fm.fmFname}</span>（${fm.fmLname_k}&nbsp;&nbsp;${fm.fmFname_k}）</div>
		<div class='birth'>［生］${fm.fmBirth}</div>
		<div class='sex'>［性別］${FM_SEX[fm.fmSex]}</div>
		<div class='rs'>［続柄］${getRsStr(fm.fmBirth, fm.fmSex, fm.fmRs, tgtBirth)}</div>
		<div class='hoh'>${+fm.fmHoh? '✔︎世帯主': ''}</div>
		<div class='phone'>${fm.fmPhone? '［電話］':''} ${fm.fmPhone}</div>
		<div class='smile'>${+fm.fmSmile? `『スマイル（${smileClass}）』&nbsp;入会中`: ''}</div>
		<div class='enroll'>${+fm.fmEnroll? '清教学園幼稚園&nbsp;在園中': ''}</div>
		<div class='grad'>${+fm.fmGrad? '清教学園幼稚園&nbsp;卒園者': ''}</div>
		<!-- The following elements have absolute positions. -->
		<div class='fmNumber'>［${fmIdx + 1}］</div>
		<button id='editFamMember_${fmIdx}' class='editCard' data-fm-idx='${fmIdx}' data-tgt-cid='${tgtCid}'><span style='vertical-align: middle;'>編集</span></button>
	<div>`
	return fmCardHtml
}



// Display Family Members (plus Form) in the Admission Application Screen.
// tgtCid is the cid of the child applying admission.
const dspFamMembers = (tgtCid, thenFunc) => {
	// When famMembers is null or empty, this function do nothing.
	if(!famMembers) return false
	// Clean up the family member form.
	//document.getElementById('famMemberForm').innerHTML = ''
	// Title for famMembers
	document.getElementById('famMembersHeader').innerHTML = '家族構成'
	// Get the parent of family members.
	const elFamMembers = document.getElementById('famMembers')
	elFamMembers.style.display = 'block'
	elFamMembers.innerHTML = `<div class='capFamMembers'>出願児童と同居する家族（生年月日順）</div>`
	for(i = 0; i < famMembers.length; i++){
		// Limit to fmIniChk is 
		if(!famMembers[i].fmIniChk) continue
		// Create fmCardHtml and insert it into elFamMembers.
		elFamMembers.insertAdjacentHTML('beforeend', createFmCardHtml(i, tgtCid))
		// Add event-Listener to edit this card. 
		document.getElementById(`editFamMember_${i}`).addEventListener('click', function(e){
			const fmIdx = +e.currentTarget.dataset.fmIdx
			const tgtCid = +e.currentTarget.dataset.tgtCid
			turnOnOffDisplay(['parFamMemberForm'], ['parFamMembers'])
			//turnOnOffDisplay(['parFamMembers'], ['parFamMemberForm'])
			setFmForm(fmIdx, tgtCid, false)
			//document.getElementById('famMembers').style.display = 'none'
		}, false)
	}

	// Button to add a new family-member.
	const c = chnResvs[tgtCid].child// for shortening.
	const btnAddNewMember = `<button id='addNewFamMember'><span style='vertical-align: middle;'>家族を追加</span></button><div class='capAddNewMember'>出願児童と同居（同じ住所）の方は全員追加してください。</div>`
	elFamMembers.insertAdjacentHTML('beforeend', btnAddNewMember)

	// Add event-listener to "btnAddNewMember".
	// Note that in the case of "adding a new family-member", the number of famMembers.length is appropriate as the "fmIdx" for the function "setFmForm".
	document.getElementById('addNewFamMember').addEventListener('click', function(){
		turnOnOffDisplay(['parFamMemberForm'], ['parFamMembers'])
		setFmForm(famMembers.length, tgtCid, false)
	})

	scrollTo('phaseTitle')
}





/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□*/
/* ■□■□■□■□■□■□■□ Family Related □■□■□■□■□■□■□■ */

// Id's for family related.
// There is no specific equivalent to REQ in FM.
const FR_IDS = ['uid', 'cid', 'frChkAddr', 'frSglPar', 'frLivPro', 'frLivProStart', 'frIniChk']

const FR_IDS_INP = ['frChkAddr', 'frSglPar', 'frLivPro', 'frLivProStart', 'frIniChk']



// Initialize the object: "famRel".
const initFamRel = () => {
	// It is assumed that "famRel" is an object.
	// Remark that "famMembers" is an array of objects, but famRel is simply an object.

	// This function works only when famRel is null or famRel.length is zero.
	if(famRel && famRel.length) return false

	// "frChkAddr" means "is Address confirmed?".
	// "frSglPar" means "is it single-parent?". 
	// "frLivPro" means "is livelihood-protected (under livelihood protection system)?". And "frLivProStart" its starting date.
	famRel = {uid: user.uid, cid: 0, frChkAddr: 0, frSglPar: 0, frLivPro: 0, frLivProStart: '', frIniChk: 0}
}



// Parsing famRel, 
const parseFamRel = (tgtCid) => {
	// There are no complex requirements as in the case of "famMembers". However, we need to make sure that "famRel" is the right thing to do.
	if(!+famRel.frIniChk){
		turnOnOffDisplay(['parFamRelForm'], ['parFamRel'])
		const msg = `<div>
			<div>★世帯状況関連項目の追加・編集</div>
			<div class='msg'>以下は、家族構成とともに<span class='crimson'>市への給付認定申請に必要な項目</span>です。ご確認の上、必要に応じてチェック、入力等をお願いいたします。</div>
		</div>`
		document.getElementById('famRelFormHeader').innerHTML = msg
		setFrForm(tgtCid, true)
		return false
	}
	turnOnOffDisplay(['parFamRel', 'parPortraitCtrl'], ['parFamRelForm'])
	dspFamRel(tgtCid)
	parsePortraitCtrl(tgtCid)
}



// Get fr input values with keys in "ids".
const getFrInpValues = (ids) => {
	const inpVals = {}
	for(let id of ids){
		const el = document.getElementById(id)
		if(el.tagName === 'INPUT'){
			if(el.type === 'text'){
				inpVals[id] = el.value// string
			}else if(el.type === 'checkbox'){
				// el.checked itself is Boolean. But we convert it to 1 or 0 to save into the DB table.
				inpVals[id] = +el.checked// boolean
			}else if(el.type === 'date'){
				inpVals[id] = el.value// string of fomat 'yyyy-mm-dd'
			}
		}else if(el.tagName === 'SELECT'){
			inpVals[id] = el.value
		}
	}
	return inpVals
}



// Checking whether the required form-items are already filled or not.
const isFrFormFilled = () => {
	// Has the address been verified?
	if(!+document.getElementById('frChkAddr').checked) return false
	// Isn't it that the livelihood protection is checked, but the protection start date has not been entered yet?
	if(document.getElementById('frLivPro').checked && !+document.getElementById('frLivProStart').value.length) return false
	// Is "All right as above." checked?
	if(!+document.getElementById('frIniChk').checked) return false
	return true
}



// Check frForm inputs. It is abbreviated as "dBUFR".
const dspBtnUpdFamRel = () => {
	document.getElementById('updFamRel').style.display = isFrFormFilled()? 'block': 'none'
}
const dBUFR = dspBtnUpdFamRel



// Create famRel Form Html.
const createFrFormHtml = (tgtCid, undIniConstr) => {
	// Get the child data.
	const c = chnResvs[tgtCid].child

	// Cancel and Update buttons.
	const btnCancel = `<button id='cancelFrForm' class='cancel' data-tgt-cid='${tgtCid}' data-und-ini-constr='${undIniConstr}' data-tgt-cid='${tgtCid}'><span style='vertical-align: middle;'>キャンセル</span></button>`
	const btnUpdate = `<button id='updFamRel' class='update' data-tgt-cid='${tgtCid}'><span style='vertical-align: middle;'>更新</span></button>`

	const fr = famRel// for shortening.

	const frFormHtml = `<div class='frForm'>
		<div class='hWrap'>
			<div class='parAddrTtl'>
				<div class='addrTtl'>現住所</div>
				<div class='addrTtlMsg'>現住所に誤りのある場合は［戻る］ボタンでホーム画面に戻り、利用者の［情報の確認・変更］でご訂正ください。</div>
			</div>
			<div class='parAddr'>
				<div class='addr'>${user.prefecture}${user.cityarea}${user.street}${user.building? user.building: ''}</div>
				<input id='frChkAddr' type='checkbox' ${+fr.frChkAddr? "checked": ""} onInput='dBUFR()'>上記住所について確認済み
			</div>
		</div>
		<div class='hWrap'>
			<div class=''>
				<!-- <div class='ttl'></div> -->
				<input id='frSglPar' type='checkbox' ${+fr.frSglPar? "checked": ""} onInput='dBUFR()'>「ひとり親世帯」である
			</div>
		</div>
		<div class='hWrap'>
			<div>
				<!-- <div class='ttl'></div> -->
				<input id='frLivPro' type='checkbox' ${+fr.frLivPro? "checked": ""} onInput='dBUFR()'>「生活保護適用」を受けている
			</div>
			<div id='outrFrLivProStart'>
				<div class='ttl'>保護開始日</div>
				<input id='frLivProStart' type='date' value='${fr.frLivProStart}' onInput='dBUFR()'>
			</div>
		</div>
		<div class='hWrap'>
			<div class='outrChkBox'>
				<div class='ttl'>以上の内容で OK ですか？</div>
				<input id='frIniChk' type='checkbox' ${+fr.frIniChk? "checked": ""} onInput='dBUFR()'> OK<span class='font08 hotpink'>（後からも内容の修正は可能です）</span>
			</div>
		</div>
		${btnCancel}
		${btnUpdate}
	</div>`
	return frFormHtml
}



// Setting famRelForm
const setFrForm = (tgtCid, undIniConstr) => {
	turnOnOffDisplay(['parFamRelForm'], ['parFamRel'])
	const elFamRelForm = document.getElementById('famRelForm')
	elFamRelForm.innerHTML = createFrFormHtml(tgtCid, undIniConstr)

	scrollTo('phaseTitle')

	// Add event-listeners.
	// Displaying the input[type='date'] form for the start of livelihood protection.
	// First, confirming the initial state.
	document.getElementById('outrFrLivProStart').style.display = document.getElementById('frLivPro').checked? 'block': 'none'
	document.getElementById('frLivPro').addEventListener('change', function(e){
		document.getElementById('outrFrLivProStart').style.display = e.currentTarget.checked? 'block': 'none'
	})

	// Cancel button
	document.getElementById('cancelFrForm').addEventListener('click', function(e){
		// First, destroy the form.
		document.getElementById('famRelForm').innerHTML = ''
		// Get undIniConstr (remark it is a string taking 'true' or 'false').
		const undIniConstr = e.currentTarget.dataset.undIniConstr
		if(undIniConstr === 'true'){
			// Go back to 「登録・予約状況」
			turnOnOffDisplay(['main'], ['forms'])
			elem.phaseTitle.innerHTML = '登録・予約状況'
			elem.message.innerHTML = ''
		}else{
			// Turn on the display of famRel.
			turnOnOffDisplay(['parFamRel'], ['parFamRelForm'])
		}
	})

	// Update button
	document.getElementById('updFamRel').addEventListener('click', function(e){
		const tgtCid = +e.currentTarget.dataset.tgtCid
		// Get current inputs.
		famRel = getFrInpValues(FR_IDS_INP)
		// Exceute "doFetch"
		doFetch('updFamState', {cid: tgtCid})
	})
	
	// Once do dBUFR.
	dBUFR()
}



// Create famRel Card Html. Unlike in the case of famMembers, there is only one card.
const createFrCardHtml = (tgtCid) => {
	const tgtBirth = chnResvs[tgtCid].child.cbirth
	const famRelCardHtml = `<div id='frCard0' class='frCard'>
		<div class='parAddr'>
			<div>［現住所］</div>
			<div class='addr'>${user.prefecture}${user.cityarea}${user.street}${user.building? user.building: ''}</div>
		</div>
		<div>${+famRel.frSglPar? '&nbsp;&nbsp; ✔︎ひとり親世帯': ''}</div>
		<div>${+famRel.frLivPro? `&nbsp;&nbsp; ✔︎生活保護適用（${famRel.frLivProStart}&nbsp;開始）`: ''}</div>
		<!-- The following elements have absolute positions. -->
		<button id='editFamRel' class='editCard' data-tgt-cid='${tgtCid}'><span style='vertical-align: middle;'>修正</span></button>
	<div>`
	return famRelCardHtml
}



// Display famRel in the Admission Application Screen.
// tgtCid is the cid of the child applying admission.
const dspFamRel = (tgtCid) => {
	// Clean up the famRel form.
	document.getElementById('famRelForm').innerHTML = ''
	turnOnOffDisplay(['parFamRel'], ['parFamRelForm'])
	// Get the parent of family members.
	const elFamRel = document.getElementById('famRel')
	elFamRel.style.display = 'block'
	elFamRel.innerHTML = `<div class='capFrCard'>住所・その他</div>`
	// Create famRelCardHtml (only one card) and insert it into elFamRel.
	elFamRel.insertAdjacentHTML('beforeend', createFrCardHtml(tgtCid))
	// Add event-Listener to edit the famRel contents.
	document.getElementById('editFamRel').addEventListener('click', function(e){
		const tgtCid = +e.currentTarget.dataset.tgtCid
		turnOnOffDisplay(['parFamRelForm'], ['parFamRel'])
		setFrForm(tgtCid, false)
	}, false)

	scrollTo('phaseTitle')
}







/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□ */
/* ■□■□■□■□■□■□■□ Portrait □■□■□■□■□■□■□■ */

// Parsing portrait control.
const parsePortraitCtrl = (tgtCid) => {
	const elPortraitCtrl = document.getElementById('portraitCtrl')
	// If elPortraitCtrl has no contens, create it. 
	if(!elPortraitCtrl.innerHTML.length) createPortraitCtrl(elPortraitCtrl, tgtCid)

	setPortraitCtrl(tgtCid, 'modAdmAppForm')
}



// "child" is the object of child data which is obtained as one record in the children table.
const setPortraitCtrl = (tgtCid, ph) => {
	// Return while the "famMembsers" has no chilren, 
	if(famMembers.length < 2) return

	// Get the object of child data from chnResvs[tgtCid]. It is the same as a specific record in the children table.
	const c = chnResvs[tgtCid].child// for shortening.

	// Put the guide message.
	document.getElementById('portraitGuideMsg').innerHTML = !c.dataUrl.length? `<div>出願児童である <span class='crimson'>${c.clname}${c.cfname}</span> さまの写真（上半身，正面，脱帽，3ヶ月以内撮影）をアップロードしてください。</div>`: ''

	const elPortImg = document.getElementById('portImg')
	elPortImg.src = c.dataUrl
	elPortImg.onload = () => {
		const elPortCap = document.getElementById('portCap')
		elPortCap.innerHTML = c.dataUrl.length? elPortCap.dataset.strRegdImg: elPortCap.dataset.strNoImg
		const elPortRegdImg = document.getElementById('portRegdImg')
		elPortRegdImg.src = c.dataUrl
		elPortRegdImg.onload = () => {
			const elPortRegdCap = document.getElementById('portRegdCap')
			elPortRegdCap.innerHTML = c.dataUrl? elPortRegdCap.dataset.strRegdImg: ''
			document.getElementById('portMsg').innerHTML = ''
		}
	}

	// Here, we initialize the global variable "newDataUrl" to empty.
	newDataUrl = ''
	document.getElementById('portBtnUpd').style.display = 'none'

	// Whether the button to delete the portrait is displayed or not.
	document.getElementById('portBtnDel').style.visibility = c.dataUrl? 'visible': 'hidden'

	// Dsipaly button to 
	dBRH(tgtCid)

	if(ph === 'updPortrait' || ph === 'delPortrait'){
		scrollTo('portrait')
	}else if(ph === 'modAdmAppForm'){
		if(c.dataUrl.length){
			scrollTo('phaseTitle')
		}else{
			scrollTo('portrait')
		}
	}else{
		scrollTo('phaseTitle')
	}
}



// Creating the form where we upload, update or delete the portrait images of the target child.
// tgtCid is needed only for the guide message.
const createPortraitCtrl = (elPar, tgtCid) => {
	// Determine the sizes for the portrait image from the width of "elem.forms" (already rendered one).
	const whlWd = elem.forms.clientWidth
	const imgWd = 0.48 * whlWd// same as imgHt
	const capHt = 20
	
	// Prepare a flex-box "elHBox0" with full width and two vertical boxes for both left and right side of the flex-box.
	const elHBox0 = document.createElement('div')
	elHBox0.style.cssText = `width: ${whlWd}; display: flex; align-items: flex-start; justify-content: space-between; margin-top: 5px;`
	//elHBox0.style.border = '1px solid blue'//＊＊＊＊＊＊＊＊＊＊
	// Left vertical box.
	const elLeftVBox = document.createElement('div')
	elLeftVBox.style.cssText = `width: ${imgWd}px; height: auto;`
	
	// Contents of elLeftVBox are ...
	// Caption for the portrait image.
	const elPortCap = document.createElement('div')
	elPortCap.id = 'portCap'
	elPortCap.style.cssText = `width: ${imgWd}px; height: ${capHt}px; text-align: center; font-weight: bold; font-size: 1.1em;`
	//elPortCap.style.border = '1px solid blue'//＊＊＊＊＊＊＊＊＊＊
	elPortCap.dataset.strRegdImg = `<span class='bold font10 royalblue'>［登録写真］</span>`
	elPortCap.dataset.strSelImgPvw = `<span class='bold font08 palevioletred'>新たな写真のプレビュー</span>`
	elPortCap.dataset.strNoImg = `<span class='bold font09 deeppink'>現在、写真はありません</span>`
	elLeftVBox.appendChild(elPortCap)
	
	// Div element which wraps img element for the portrait.
	const elPortWrImg = document.createElement('div')
	elPortWrImg.style.cssText = `width: ${imgWd}px; height: ${imgWd}px; background-color: whitesmoke;`
	//elPortWrImg.style.border = '1px solid red'//＊＊＊＊＊＊＊＊＊＊
	const elPortImg = document.createElement('img')
	elPortImg.id = 'portImg'
	elPortWrImg.appendChild(elPortImg)
	elLeftVBox.appendChild(elPortWrImg)
	
	// Right one is obtained as a clone of the left.
	const elRightVBox = elLeftVBox.cloneNode(false)

	// Contents of elRightVBox are as follows.
	// Div element which wraps vertically the registered image and its caption.
	const elPortWrRegd = document.createElement('div')
	elPortWrRegd.id = 'portWrRegd'
	elPortWrRegd.style.cssText = `margin-left: auto; width: ${0.5 * imgWd}px; height: ${0.5 * imgWd + capHt}px; text-align: center;`
	//elPortWrRegd.style.border = '1px solid red'//＊＊＊＊＊＊＊＊＊＊
	const elPortRegdCap = document.createElement('div')
	elPortRegdCap.id = 'portRegdCap'
	elPortRegdCap.dataset.strRegdImg = `<span class='bold font08 royalblue'>登録中の写真</span>`
	elPortWrRegd.appendChild(elPortRegdCap)
	// Small img element for the registered portrait. It also is wrapped by div.
	const elPortRegdImg = document.createElement('img')
	elPortRegdImg.id = 'portRegdImg'
	elPortWrRegd.appendChild(elPortRegdImg)
	// elPortWrRegd is hidden by default. It is visible only during a new image is previewed (by the event listener: "loadAndResizeLocalImage").
	elPortWrRegd.style.visibility = 'hidden'
	elRightVBox.appendChild(elPortWrRegd)
	
	// Div element for messsages or reports about Portrait.
	const elPortMsg = document.createElement('div')
	elPortMsg.id = 'portMsg'
	elPortMsg.style.cssText = `margin: 10px 0px 20px auto; width: ${imgWd}px; padding: 5px 10px; font-size: 0.9em;`
	elPortMsg.dataset.strNotRegd = `<span class='bold font10 crimson'>← プレビュー中の写真はまだ登録されていません！<br>［写真を登録］ボタンで登録してください。</span>`
	elPortMsg.dataset.strDeleted = `<span class='bold font10 cromson'>写真は削除されました！</span>`
	elRightVBox.appendChild(elPortMsg)
	
	// Put the both left and right vertical boxes into elHBox0.
	elHBox0.appendChild(elLeftVBox)
	elHBox0.appendChild(elRightVBox)
	
	// We prepare another flex-box "elHBox1" with the same style as elHBox0.
	const elHBox1 = elHBox0.cloneNode(false)
	// elHBox1 will contains the input elements and the delete button.
	
	// Div element which wraps input[type="file"] and its label to choose a file to preview.
	const elPortWrInpLbl = document.createElement('div')
	elPortWrInpLbl.style.cssText = `width: ${imgWd}px; height: auto; margin-right: auto; text-align: center;`
	//elPortWrInpLbl.style.border = '1px solid red'//＊＊＊＊＊＊＊＊＊＊
	const elPortInp = document.createElement('input')
	elPortInp.id = 'portInp'
	elPortInp.type = 'file'
	elPortInp.style.display = 'none'// input itself is not displayed.
	const elPortLbl = document.createElement('label')
	elPortLbl.htmlFor = 'portInp'
	elPortLbl.style.cssText = `display: block; padding: 3px 10px; background-color: royalblue; text-align: center; font-size: 0.9em; color: white;`
	elPortLbl.innerHTML = '新たな写真を選択'
	// Label does not wrap the input, but by htmlFor=id this is not a problem.
	elPortWrInpLbl.appendChild(elPortInp)
	elPortWrInpLbl.appendChild(elPortLbl)
	
	// Button to delete the registered image.
	const elPortBtnDel = document.createElement('button')
	elPortBtnDel.id = 'portBtnDel'
	elPortBtnDel.dataset.tgtCid = tgtCid
	elPortBtnDel.style.cssText = `display: block; margin-left: auto; padding: 3px 10px; background-color: palevioletred; text-align: center; font-size: 0.9em; color: white;`
	//elPortBtnDel.style.border = '1px solid red'//＊＊＊＊＊＊＊＊＊＊
	elPortBtnDel.innerHTML = '登録写真を削除'
	
	// Finally, prepare the button to update the image data to server.
	const elPortBtnUpd = document.createElement('button')
	elPortBtnUpd.id = 'portBtnUpd'
	elPortBtnUpd.dataset.tgtCid = tgtCid
	elPortBtnUpd.style.cssText = `margin: 50px auto 100px auto; width: 98%; height: 1.6rem; border-radius: 4px; background-color: cornflowerblue; font-size: 1.0rem; color: #ffffff;`
	elPortBtnUpd.innerHTML = '写真を登録'
	// This button is not displayed by default.
	elPortBtnUpd.style.display = 'none'

	// Put elPortWrInpLbl and elPortBtnDel into elHBox1.
	elHBox1.appendChild(elPortWrInpLbl)
	elHBox1.appendChild(elPortBtnDel)
	
	// Prepare the element for guide message.
	const elPortraitGuidMsg = document.createElement('div')
	elPortraitGuidMsg.id = 'portraitGuideMsg'
	elPortraitGuidMsg.style.cssText = 'margin: 5px auto; width: 98%; font-weight: bold; font-size: 0.9rem;'

	// Put two horizontal full-width boxes and the update-button into elPar.
	elPar.appendChild(elPortraitGuidMsg)
	elPar.appendChild(elHBox0)
	elPar.appendChild(elHBox1)
	elPar.appendChild(elPortBtnUpd)
	
	// Fianlly, add event listeners.
	elPortInp.addEventListener('change', loadAndResizeLocalImage, false)
	elPortBtnDel.addEventListener('click', function(e){
		const tgtCid = +e.currentTarget.dataset.tgtCid
		const elPortImg = document.getElementById('portImg')
		// It is difficult to make img.src empty.
		if(elPortImg.src.startsWith('data')){
			if(confirm('登録写真を削除してよろしいですか？')) doFetch('delPortrait', {cid: tgtCid})
		}else{
			alert('削除する写真はありません！')
		}
	})
	elPortBtnUpd.addEventListener('click', function(e){
		const tgtCid = +e.currentTarget.dataset.tgtCid
		doFetch('updPortrait', {cid: tgtCid})
	}, false)
}



// Reads the given local file (image type) as "dataURL", resizes it if it is large, and previews.
// It is to be used as an eventListener for <input type='file'> element.
const loadAndResizeLocalImage = function(e){
	const file = this.files[0]
	// If it is not a image-file, then exit.
	if(!file.type.match(/^image\/(gif|jpeg|png|webp|avif)$/)){
		alert('ファイル形式が対応外です！\n\n次のいずれかの形式の画像ファイルをご指定ください。\nJPEG, PNG, GIF, WEBP')
		return
	}
	const elPortImg = document.getElementById('portImg')
	const reader = new FileReader()
	reader.onload = (e) => {
		const dataUrl = e.target.result
		orgDataUrl = dataUrl
		// Create a HTMLImageElement instance and set the "result" (dataUrl) as its source. 
		const img = new Image()
		img.src = dataUrl
		img.onload = () => {
			console.log({width: img.naturalWidth, height: img.naturalHeight})//＊＊＊＊＊
			if(CANVAS_WIDTH < img.naturalWidth){
				// Create a canvas elemnt (Note that "cnvs" is global).
				cnvs = document.createElement('canvas')
				//cnvs.id = 'cnvs1'//＊＊＊＊＊
				cnvs.width = CANVAS_WIDTH
				cnvs.height = CANVAS_WIDTH * img.naturalHeight / img.naturalWidth
				//cnvs.style.border = 'solid 1px blue'//＊＊＊＊＊
				const ctx = cnvs.getContext('2d')
				ctx.drawImage(img, 0, 0, cnvs.width, cnvs.height)
				newDataUrl = cnvs.toDataURL('image/jpeg')// "newDataUrl" is global.
			}else{
				newDataUrl = dataUrl
			}
			elPortImg.src = newDataUrl
			elPortImg.onload = () => {
				console.log({width: elPortImg.naturalWidth, height: elPortImg.naturalHeight})
				const elPortCap = document.getElementById('portCap')
				elPortCap.innerHTML = elPortCap.dataset.strSelImgPvw
				const elPortMsg = document.getElementById('portMsg')
				elPortMsg.innerHTML = elPortMsg.dataset.strNotRegd
				document.getElementById('portWrRegd').style.visibility = 'visible'
			}
		}
	}
	reader.readAsDataURL(file)
	document.getElementById('portBtnUpd').style.display = 'block'
}





/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■ */
/* ■□■□■□ Data Check & Priority Determination □■□■□■ */


// Similar inspections are also performed in "parseAdmAppForm". But this is only for checking.
const checkAdmAppData = (tgtCid) => {
	// Verify famMembers
	for(let i = 0, len = famMembers.length; i < len; i++){
		let blanks = 0
		for(id of FM_IDS_REQ){
			if(id === 'fmIniChk'){// famMembers[i][v] is Boolean.
				blanks += !+famMembers[i][id]
			}else{// famMembers[i][v] is a string.
				blanks += !famMembers[i][id].length? 1: 0
			}
		}
		if(blanks) return false
	}

	// Next, check famRel.
	if(!+famRel.frIniChk) return false

	// Finally, confirm the image data.
	if(!chnResvs[tgtCid].child.dataUrl.length) return false

	// Once all inspections have been passed, 
	return true
}



// Determine priority for Smile members and younger siblings of current kindergartner or graduates.
const detPriority = (tgtCid, famMembers) => {
	const tgtBirth = chnResvs[tgtCid].child.cbirth
	let pts = 0//points for priority.
	for(let i = 0, len = famMembers.length; i < len; i++){
		const fm = famMembers[i]// for shortening.
		if((+fm.cid === tgtCid && +fm.fmSmile) || (fm.fmRs === 'sib' && compYmds(fm.fmBirth, tgtBirth) === -1 && (+fm.fmEnroll || +fm.fmGrad))) pts++
	}
	return pts
}



// Display button to return home.
const dspBtnReturnHome = (tgtCid) => {
	if(!famMembers) return false

	const c = chnResvs[tgtCid].child

	let htMsg = ''
	if(!checkAdmAppData(tgtCid)){
		htMsg = `<span class='deeppink'>${c.clname}${c.cfname}</span> さまに関する出願情報の登録（含写真）が未完了のようです。ご確認ください。`
	}else if(inPriorityPeriod && !detPriority(tgtCid, famMembers)){
		htMsg = `現在は <span class='deeppink'>${CUR_FY + 1}年度 3歳児3歳児，満3歳児 入園出願予約の優先受付期間</span>ですが、<span class='deeppink'>${c.clname}${c.cfname}</span> さまの出願情報が「スマイル、卒園児・在園児弟妹」の条件を未だ満たしていないようです。<br><br>出願情報を再度ご確認ください。<br><br>なお一般の出願予約受付は 9月29日 9:00 開始となっております。`
	}else{
		htMsg = `<span class='deeppink'>${c.clname}${c.cfname}</span> さまに関する出願情報が登録されましたので出願予約が可能です。<br><br>ホーム画面に戻り、出願予約を行ってください。`
	}
	// String for the button.
	const str = 'ホーム画面に戻る'
	// Put the button.
	const btnReturnHome = `<div class='msgBtnReturnHome'>${htMsg}</div><button type='button' class='full returnHome' onClick='returnHome()'><span style='vertical-align: middle;'>${str}</span></button>`
	elem.buttons.innerHTML = btnReturnHome

	scrollTo('footer', false)
}
const dBRH = dspBtnReturnHome





// dspUser() is still used with joinChnResvsHtml() to display main information in 'main'. But it is to be replaced with a method of object.
const dspUser = (user) => {
	const hBuf = `<div id='titleUser'>利用者情報</div><hr class='hrUser'>
	<div class='user'>
		${user.ulname} ${user.ufname}（${user.ulname_k} ${user.ufname_k}）さま<br>
		<span class='bold font08'>メールアドレス：${user.email}<br>電話１：${user.uphone}<br>電話２：${user.hphone}<br>住所：${user.zipcode} ${user.prefecture + user.cityarea + user.street}<br>世帯主：${user.hlname} ${user.hfname}（${user.hlname_k} ${user.hfname_k}）さま<br>校区：${user.scharea === 'その他'? user.schareaplus: user.scharea}</span>
	</div><br>
	<div class='outrBtnChgUser'>
		<div class='floatLeft'>
			<button class='change toChgEmailForm' onClick='makeForms("chgEmailForm")'>メールアドレス変更</button><br>
			<button class='change toChgPwForm' onClick='makeForms("chgPwForm")'>パスワード変更</button>
		</div>
		<button class='toModUserForm' onClick='makeForms("modUserForm"); setModUserForm()'>情報の確認・変更</button>
		<div class='clearboth'></div>
	</div><hr class='hrUser'><br>`
	return hBuf
}



const setModUserForm = () => {
	// Basic id's.
	const ids0 = ['ulname', 'ufname', 'ulname_k', 'ufname_k', 'zipcode', 'prefecture', 'cityarea', 'street', 'uphone', 'scharea', 'schareaplus']
	// Hoh id's
	const ids1 = ['hlname', 'hfname', 'hlname_k', 'hfname_k', 'hphone']
	let ids
	if(+user['hohequsr']){
		ids = [...ids0]
		document.getElementById('hohEqUsr').checked = true
		document.getElementById('hohForm').style.visibility = 'collapse'
	}else{
		ids = [...ids0, ...ids1]
		document.getElementById('hohEqUsr').checked = false
		document.getElementById('hohForm').style.visibility = 'visible'
	}
	for(let i = 0, len = ids.length; i < len; i++){
		document.getElementById(ids[i]).value = user[ids[i]]
	}
	elem.btnBackward.innerHTML = `<button class='backward' onClick='returnHome()'>戻る</button>`
}





// ＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
// ＊＊＊＊＊＊＊　202108 NEW PART（BELOW）　＊＊＊＊＊＊＊


// EventReservations Constructor: Event data and its current State of reservations.
const EventReservations = function(evt){
	// data from evt
	for(let key of Object.keys(evt)){
		// evt's members are all strings, but originally 'capacity' and 'dedupe' are integers
		this[key] = ['capacity', 'dedupe', 'wait', 'display', 'mthlmt', 'fyear'].includes(key)? +(evt[key]): evt[key]
	}
	// current resvs-state
	this.rids = []
	this.cids = []
	this.uids = []
	this.sold = 0
}



// Parse evts and resvs into evtsResvs (an object of instances of "Eventstate"), where evts and resvs are selected records of 'events' and 'children' tables respectively.
// This process can be done before login.
const parseToEvtsResvs = (evts, resvs) => {
	// Prepare an object for the return value.
	const evtsResvs = {}
	// We pass each of evts (but of type of typNames) to the constructor "new EventReservations()".
	for(let i = 0, len = evts.length; i < len; i++){
		if(evts[i].typ in typNames){
			// Note that evts[i] is passed by "reference". So we must'nt update the part.
			evtsResvs[evts[i].eid] = new EventReservations(evts[i])
		}
	}
	// Append values from resvs into arrays of corresponding member of evtsResvs.
	for(let i = 0, len = resvs.length; i < len; i++){
		const r = resvs[i]// for shortening
		if(r.eid in evtsResvs){
			evtsResvs[r.eid].rids.push(+r.rid)
			evtsResvs[r.eid].cids.push(+r.cid)
			evtsResvs[r.eid].uids.push(r.uid)
		}
	}
	// Get the value of "sold" for each event.
	for(let eid of Object.keys(evtsResvs)){
		const e = evtsResvs[eid]// for shortening
		e.sold = e.dedupe? Array.from(new Set(e.uids)).length: e.uids.length
	}
	return evtsResvs
}



// Child Reservations: Child' own data & his or her Reservations (reserved(resvd) or possible(posbl) events).
// "posbl" (possible) is further divided into "avbl" (available) and "wtbl" (waitable).
const ChildReservations = function(child){
	this.child = child
	this.resvd = []// currently reserved ones.
	//this.eidtrain = ''// joined eids.
	this.posbl = {}
	// Initialize this.posbl such as {wk:{avbl:[], wtbl:[]}, bc:{avbl:[], wtbl:[]}, ...}
	for(let typ of Object.keys(typNames)){
		this.posbl[typ] = {avbl: [], wtbl: []}
	}
}



// Parse rsrs (with evtsResvs) into chnResvs.
// It need to be logged in to do this.
// Here, "children" is assumed to be of the target parent(user).
const parseToChnResvs = (children, resvs, evtsResvs) => {
	// Prepare the instances of ChildReservations with keys from "children".
	// It will be the return value.
	const chnResvs = children.reduce((o, c) => (o[c.cid] = new ChildReservations(c), o), {})

	for(let i = 0, len = resvs.length; i < len; i++){
		const r = resvs[i]// for shortening
		//const r = {}//for converting some members to integers and shortening.
		// pick up resv's of the user's children.
		const utEdate = getJstFromStr(r.edate)
		if(utNow < utEdate && r.typ in typNames && r.cid in chnResvs){
			chnResvs[+r.cid].resvd.push({...r})//using copy to be able to add keys.
			//chnResvs[+r.cid].eidtrain += r.eid// ... old style
		}
	}
	// Get States for each child.
	for(let cid of Object.keys(chnResvs)){
		// Current index in the waiting list and waiting-length for the child.
		const utCbirth = getJstFromStr(chnResvs[cid].child.cbirth)
		for(let i = 0, len = chnResvs[cid].resvd.length; i < len; i++){
			const r = chnResvs[cid].resvd[i], e = evtsResvs[r.eid]//for shortening.
			// Add new key "index" to chnResvs[cid].resvs[i].
			r.index = (+e.dedupe? Array.from(new Set(e.uids)).indexOf(uid): e.cids.indexOf(+r.cid)) + 1
			// Add new key "wtngLen"(waiting-list-length) to chnResvs[cid].resvs[i].
			r.wtngLen = (r.capacity && r.index > r.capacity)? r.index - r.capacity: 0
		}
		// Current available or waitable events of each types for the child.
		for(let eid of Object.keys(evtsResvs)){
			const e = evtsResvs[eid]//for shortening.
			const utAcc0 = getJstFromStr(e.acc0)
			const utAcc1 = getJstFromStr(e.acc1)
			const utBirth0 = getJstFromStr(e.birth0)
			const utBirth1 = getJstFromStr(e.birth1)
			// "typYM" is "type Year Month" such as e.g. "wk202306"
			const typYM = eid.slice(0, 8)
			//if(utAcc0 <= utNow && utNow < utAcc1 && utBirth0 <= utCbirth && utCbirth < utBirth1 && ((e.typ != 'be' && chnResvs[cid].eidtrain.indexOf(eid) < 0) || (e.typ == 'be' && !chnResvs[cid].eidtrain.match(typYM)))){
			if(utAcc0 <= utNow && utNow < utAcc1 && utBirth0 <= utCbirth && utCbirth < utBirth1 && (!chnResvs[cid].resvd.map(v => v.eid).includes(eid)) && (!e.mthlmt || chnResvs[cid].resvd.reduce((a, v) => (a += (v.eid.slice(0, 8) === typYM)? 1: 0, a), 0) < +e.mthlmt)){
				// For the case of e.dedupe === 1 (i.e. typ === 'wk'?), we need "uIndex" which is the ranking of uid within uids excluding duplicates and "uSold" which is the length of uids also excluding duplicates.
				const uIndex = Array.from(new Set(e.uids)).indexOf(uid)// +1 is not needed.
				const uSold = Array.from(new Set(e.uids)).length
				// capacity == 0 → free, wait == 0 → capacity exists but able to resv beyond that
				if(e.capacity === 0 || e.wait === 0 || e.sold < e.capacity || (e.dedupe && (uSold < e.capacity || (-1 < uIndex && uIndex < e.capacity)))){
					// i.e. available
					chnResvs[cid].posbl[e.typ].avbl.push(eid)
				}else if(e.wait === 1){
					// using waitlist
					chnResvs[cid].posbl[e.typ].wtbl.push(eid)
				}
			}
		}
	}
	return chnResvs
}



// Display the state of reservations and waitings.
// Note it is used for both "EvtSched" and "ChnResvs".
const dspResvWtng = (e) => {
	// First, find the excess number.
	const excess = (e.capacity && e.wait < 2 && e.sold > e.capacity)? e.sold - e.capacity: 0
	// Remark the fact that excess > 0 implies wait < 2.
	// Symbol for excess and sold(reservations includeing excesses).
	const sExc = e.wait? '待': '超'// wait: 1 → 待，0 → 超
	const sSol = e.wait < 2? '計': '予'// wait: 2 → 予，1 or 0 → 計
	//return `計${e.sold}${exStr}／${e.capacity? '定' + e.capacity: '定数なし'}`
	// The part of excess is not displayed when excess === 0.
	const excPart = excess? `（${sExc}${excess}）`: '&nbsp;'
	return `${sSol}${e.sold}${excPart}／&nbsp;${e.capacity? `定${e.capacity}`: '定数なし'}`
}



// Create figure of queue
// cap: cpacity, ttl: taotal, ex: exceed, wtng: waiting, ord: (your) order
/*
const createQueueFig = () =>{

}
*/



// Create Html of Events-Schedule.
const createEvtsSchedHtml = (evtsResvs) => {
	const bufEvts = {}//indexed by typ.
	//let item = ''
	for(let typ of Object.keys(typNames)){
		bufEvts[typ] = `<hr class='hrAccEve'><div class='typRoot ${typ}'>◆${typNames[typ]}</div>`
	}
	let prevFyear = 0
	for(let eid of Object.keys(evtsResvs)){
		const e = evtsResvs[eid]
		// It has already confirmed that e.acc0 <= dtNow < edate.
		const utAcc1 = getJstFromStr(e.acc1)
		if(utNow < utAcc1){
			const state = e.display? `［${dspResvWtng(e)}］`: ''
			// We display 'fyear' only when typs is 'aa' or 'pr'.
			// If fyear is different from prevFyear, we display fyear-title.
			bufEvts[e.typ] += (['aa', 'pr'].includes(typs) && prevFyear !== e.fyear)? `<div class='fyear ${e.typ}${prevFyear? " marginTop70": ""}'>［${e.fyear}年度］</div>`: ''
			// difference is only in style.
			if(e.capacity === 0 || e.wait < 2 || e.sold < e.capacity){
				bufEvts[e.typ] += `<div class='avblEvt ${e.typ}'>`
			}else{
				bufEvts[e.typ] += `<div class='soldOut'>`
			}
			bufEvts[e.typ] += `${e.etitle}${e.display? state: ""}</div>`
			prevFyear = e.fyear
		}
	}
	let html = ''// html-Buffer
	html += `<div class='outrAvblEveTitle'><div style='margin: 0 5px 10px 5px; font-weight: bold; font-size: 0.8em;'>`
	html += `<!--<a href='http://kg.seikyo.ed.jp'><span style='color: #cd5c5c;'>★インフルエンザ等の感染症の状況を園Webサイトに掲載していますのでご参照ください。</span></a>-->`
	html += `${['aa', 'pr'].includes(typs)? "": "<span style='color: #333399;'>★子育て支援プログラムの予約・キャンセル受付は当日午前９時までとなります。</span>"}<br><br></div>`
	if(evts.filter(x => typs.split(',').includes(x.typ)).length){
		//★★★★★ dspWtngState or not:
		if(dspWtngState && !['aa', 'pr'].includes(typs)){
			html += `<div class='avblEvtTitle'>
				<div class='font11'>
					以下の予約を受付中です。
				</div>
				<div class='font08'>
					<span class='bold tomato'>［予(or計)S&nbsp;（待(or 超)E)&nbsp;／&nbsp;定C］</span>の S, E, C はそれぞれ <span class='bold tomato'>S=予約(or 合計)数，E=待ち(or 超過)数，C=定数</span>を表します。
				</div>
			</div>`
		}else{// i.e, not dspWtngState or aa, pr:
			html += `<div class='avblEvtTitle'>以下の予約を受付中です。</div>`
		}
	}else{
		html += `<div class='avblEvtTitle'>ただいま予約受付中のプログラムはありません。</div>`
	}
	html += `<button class='refreshAvblEvts' onClick='doFetch("refreshAvblEvt")'><img src='./images/refresh2.png' alt='情報更新'></button><div class='clearboth'></div></div>`
	for(let typ of Object.keys(typNames)){
		html += bufEvts[typ]
	}
	html += `<hr class='hrAccEve'>`
	return html
}



// Create Html of chnResvs (Children Reservations).
// i.e, (1) reserved or waiting events, (2) buttons for reservation (or waiting)
ChildReservations.prototype.createChnResvsHtml = function(){
	const c = this.child// for shotening
	let html = ''// chnResvs buffer

	let bufResvd = '', bufWtng = ''
	for(let i = 0, len = this.resvd.length; i < len; i++){
		const r = this.resvd[i], e = evtsResvs[r.eid]//for shortening
		const unitName = ['aa', 'pr'].includes(e.typ)? '人': '組'
		const utAcc1 = new Date(r.acc1.replace(/-/g, "/")).getTime()
		// Note that some members (which are originally intgers) of 'r' are still strings. So, do not use them for comparison. We recommend using the members of 'e' for comparison.
		let state = r.wtngLen? `＊定数${e.capacity}に対して現在${r.index}番目<span class='deeppink'>（${r.wtngLen}${unitName}待ち）</span>です。`: ''
		state += `［${e.wait === 1? '全体状況： ':''}${dspResvWtng(e)}］`
		let item = `<div class='outrResv'><div class='resv'><span class='${e.typ}'>${e.etitle}</span><br><span class='font09'>${e.display? state: ''}</span></div>`

		item += (utNow < utAcc1 && !+r.participate)? `<button class='cfmDelResv' onClick='cfmDelResv("${r.rid}", "${r.cid}", "${r.typ}", "${e.eid}", "${r.wtngLen}")'>×</button>`: `<span class='noCancellation' >●</span>`

		item += `<div class='clearboth'></div></div>`

		if(e.capacity === 0 || r.index <= e.capacity){
			bufResvd += item
		}else{
			bufWtng += item
		}
	}

	// Prepare the button to "modAdmAppForm".
	let htBtnToModAdmAppForm = ''
	if(typs === 'aa'){
		const pAa = this.posbl.aa
		// this.resvd.length is for displaying［出願情報の登録］button even the reservation is done.
		if(pAa.avbl.length || pAa.wtbl.length || this.resvd.length){
			htBtnToModAdmAppForm = `<button class='toModAaForm' onClick='makeForms("modAdmAppForm", ${c.cid})'>出願情報の登録</button>`
		}
	}

	html += `<hr class='hrChild'><div class='outeChild'><div class='child'>${c.clname} ${c.cfname}<span class='bold font07'>（${c.clname_k} ${c.cfname_k}）さま<br>${c.cbirth.substr(0, 10)} 生（${c.csex === 'm'? '男': '女'}）</span></div><div class='chRBox'><button class='toModChildForm' onClick='makeForms("modChildForm"); setModChildForm(${c.cid})'>情報の確認・変更</button>${htBtnToModAdmAppForm}</div><div class='clearboth'></div></div>`

	//★★★★★ dspWtngState or not:
	/*
	if(dspWtngState){
		if(bufResvd || bufWtng) html += `<div class='font08 dimgray'>注：以下で <span class='bold tomato'>［順S／計T（待W or 超E）／定C］</span>は、<span class='bold tomato'>S=${c.clname}さま現在順位，T=受付計，W=待ち数，E=超過数，C=定数</span> を表します。</div>`
	}
	*/

	html += `<div class='resvdListTitle'>★${c.cfname}さま　予約状況<!-- &emsp;<span class='colNoCancellation'>●</span>はキャンセル不可 --></div>`
	html += bufResvd? `<div class='resvdWtngList'>${bufResvd}</div>`: `<div class='bold font08 steelblue'>　現在、${c.cfname}さまの予約はありません</div>`

	//★★★★★ dspWtngState or not:
	if(dspWtngState && bufWtng){
		html += `<div class='wtngListTitle'>★${c.cfname}さま　キャンセル待ち状況</div><div class='resvdWtngList'>${bufWtng}</div>`
	}

	// "admAppCond" is "admission application condition"
	// It is true by default since no interference shall be permitted except when typs === 'aa'.
	let admAppCond = true
	
	if(typs === 'aa'){
		if(!checkAdmAppData(+c.cid)) admAppCond = false
		if(inPriorityPeriod && !detPriority(+c.cid, famMembers)) admAppCond = false
	}

	html += `<div id='btnResv${c.cid}'>`
	//html += `<div class='captionBuAddResv'>${c.cfname}さまのご予約は次のボタンから！</div><div class='outrBtnAddResv'>`
	let htBtnAvblWtng = ''
	let cntBtnWtng = 0
	for(let typ of Object.keys(typNames)){
		const p = this.posbl[typ]
		if((p.avbl.length && admAppCond) || p.wtbl.length){
			let htAct
			if(p.wtbl.length){
				//htAct = `<div class='font07'>キャンセル待ち登録</div>`
				htAct = `<div>予約等</div>`
				cntBtnWtng++
			}else{
				htAct = '<div>予約</div>'
			}
			htBtnAvblWtng += `<div class='reserve ${typ}' onClick='dspFormAddResv("${typ}", "${c.cid}")'>
				<div>
					<div class='white'>${typNames[typ]}</div>
					<div class='white'>${htAct}</div>
				</div>
			</div>`
		}
	}
	html += htBtnAvblWtng.length? `<div class='captionBuAddResv'>${c.cfname}さまのご予約${cntBtnWtng? '（またはキャンセル待ち登録）': ''}は次のボタンから！</div><div class='outrBtnAddResv'>${htBtnAvblWtng}<div class='clearboth'></div></div>`: ''
	html += `<!-- #btnResv${c.cid} --></div>`

	html += `<div id='addResvForm${c.cid}' class='addResvForm'></div>`
	return html
}



// Display Form for adding a reservation.
const dspFormAddResv = (typ, cid) => {
	curCid = cid//curCid: global
	phase = 'addResvForm'// assignment to a global parameter.
	elem.report.innerHTML = ''
	elem.forms.innerHTML = chnResvs[cid].createChoicesHtml(typ)
	elem.main.innerHTML = ''
	// arrange FiPastPt
	checkPastPtBoxes(chnResvs[cid].child)
	elem.btnBackward.innerHTML = `<button class='backward' onClick='returnHome("")'>戻る</button>`
	// Add event listener for entDate choidces.
}



// create Choices of input(radio button)s for addResvForm.
ChildReservations.prototype.createChoicesHtml = function(typ){
	const p = this.posbl[typ], c = this.child// for shotening
	let html = ''// choices buffer

	// "pChoices" is "possible choices" with keys 'avbl' and 'wtbl'.
	const pChoices = {avbl: '', wtbl: ''}
	for(let xbl of ['avbl', 'wtbl']){
		if(p[xbl].length && (xbl === 'avbl' || dspWtngState)){
			for(let i = 0, len = p[xbl].length; i < len; i++){
				const e = evtsResvs[p[xbl][i]]

				// State of reservations and waitings
				const stateResvWtng = ['aa', 'pr'].includes(typ)? '': `［${dspResvWtng(e)}］`

				// When xbl === 'wtbl', add wating number info.
				let wtngNumForecast = ''
				if(xbl === 'wtbl'){
					// Getting uIndex and uSold
					const uIndex = Array.from(new Set(e.uids)).indexOf(uid)// +1 is not needed.
					const uSold = Array.from(new Set(e.uids)).length
					const unitName = ['aa', 'pr'].includes(typ)? '人': '組'
					// Waiting number. Note in case of dedupe, there are two patterns: whether uid is alraedy in e.uids or not.
					const wtngNum = e.dedupe? (uIndex > -1? uIndex + 1 - e.capacity: uSold + 1 - e.capacity): e.sold + 1 - e.capacity
					wtngNumForecast = `<span class='bold font08 red'>（登録すれば${wtngNum}${unitName}待ち）</span>`
				}
				
				// Input[type='radio']s for possible choices.
				// Note that name='addlChoices' is for clearing html, data-posbl-key='${xbl}' is for reporting.
				if(typ !== 'aa' || checkAdmAppData(c.cid) || xbl === 'wtbl'){
					pChoices[xbl] += `<div>
						<div class='outrInputRadio ${typ}'>
							<input type='radio' class='radioPlain' name='evtToReserve' value='${p[xbl][i]}' onChange='dspAddlChoices("${c.cbirth}", "${p[xbl][i]}"); dBDF()'>${e.etitle}
							${wtngNumForecast}${stateResvWtng}
						</div>
						<div id='addl_${p[xbl][i]}' name='addlChoices' class='addlChoices' data-posbl-key='${xbl}'></div>
					</div>`
				}
			}
		}
	}

	html += `<hr class='hrChild'><div class='outeChild'><div class='child'>${c.clname} ${c.cfname}<span class='bold font09'>（${c.clname_k} ${c.cfname_k}）さま</span></div><div class='clearboth'></div></div>`

	// In case of AA (Admission Application)
	//★★★★★ dspWtngState or not:
	/*
	if((pChoices.avbl + pChoices.wtbl).length && dspWtngState){
		html += `<div class='font08 dimgray'>注：以下で <span class='bold tomato'>［予(or計)S&nbsp;（待(or 超)E)&nbsp;／&nbsp;定C］</span>の S, E, C はそれぞれ <span class='bold tomato'>S=予約(or 合計)数，E=待ち(or 超過)数，C=定数</span> を表します。</div><br><br>`
	}
	*/
	// avbl part:
	if(pChoices.avbl.length){
		html += `<div class='bold font10'>次の&nbsp;<span class='bold font11 ${typ}'>${typNames[typ]}</span>&nbsp;${['aa', 'pr'].includes(typ)? "項目": "プログラム"}が&nbsp;<span class='bold font11 deeppink'>予約可能</span>&nbsp;です。選択して送信してください。<br><input id='typ' type='hidden' value='${typ}'><input id='email' type='hidden'><input id='cid' type='hidden' value='${c.cid}'>${pChoices.avbl}</div>`
	}else{
		html += `<div class='bold font10'>現在、予約可能な&nbsp;<span class='bold font11 ${typ}'>${typNames[typ]}</span>&nbsp;${['aa', 'pr'].includes(typ)? '項目': 'プログラム'}はありません。</div><br>`
		// When typ is 'aa', pChoices.avbl is empty even though p.avbl is not, which means that admApp is not done.
		if(typ === 'aa' && p.avbl.length){
			html += `<div class='bold font09'><span class='bold font10 ${typ}'>${p.avbl.map(v => evtsResvs[v].etitle).join(',&nbsp;')}</span>&nbsp;が${c.cfname}さまの年齢に適合しています。<span class='bold font10 ${typ}'>［出願情報の登録］</span>をお済ませいただきますと、ご予約可能となります。</div>`
		}
		noDBSQ = 1
	}
	// wtbl part:
	//★★★ If dspWtngState is false, then pChoices.wtbl.length is zero.
	if(pChoices.wtbl.length){
		html += `<br><br><div class='bold font10'>次の&nbsp;<span class='bold font11 ${typ}'>${typNames[typ]}</span>&nbsp;${['aa', 'pr'].includes(typ)? "項目": "プログラム"}が&nbsp;<span class='bold font10 deeppink'>キャンセル待ち登録可能</span>&nbsp;です。<br><input id='typ' type='hidden' value='${typ}'><input id='email' type='hidden'><input id='cid' type='hidden' value='${c.cid}'>${pChoices.wtbl}</div>`
	}else{
		html += `<!--<div class='bold font10 hotpink'>現在、キャンセル待ち登録が可能な&nbsp;<span class='bold font11 ${typ}'>${typNames[typ]}</span>&nbsp;${['aa', 'pr'].includes(typ)? '項目': 'プログラム'}はありません</div><br>-->`
		noDBSQ = 1
	}
	// fiComment, fiQuestion, fiPastPt
	if((pChoices.avbl + pChoices.wtbl).length){
		// fiComment
		html += `<div class='formItem'><span class='bold font09'>${['aa', 'pr'].includes(typ)? "他にご連絡等があればご記入ください。": "コメント・質問など"}</span><br><textarea id='comment' class='tarea' onChange='dBDF()'></textarea></div>`
		// fiPastPt
		html += createFiPastPt(typ)
		html += (pChoices.avbl + pChoices.wtbl).length? `<br><div class='bold font10'>項目を選択して送信してください！</div><br>`: ''
	}
	return html
}



// Get his or her "School Birthyear" (abbreviated as "schBY") from the birthdate.
// Those born between April 2 and April 1 of the following year will have the same schBY. Those with the same schBY have the same age as of April 1 of each year.
// Here "birth" is assumed to hava the format "yyyy-mm-dd HH:NMM:SS".
const schBY = (birth) => {
	return +birth.slice(0, 4) + ((+birth.slice(5, 7) < 4 || birth.slice(5, 10) === '04-01')? -1: 0)
}



// Obtaining the entrance and gradudation date choices. There are 3 options as the entrance date of next FY, including the possibility of admission to the 3-year-old class. They are (all within the next FY) (1)Apr 1, (2)Birthday of 3yo, (3)1st of the month following the month of birth. Furthermore, for the admission in current FY, any day after today (after bDay of 3yo) is permissible. However, it will be handled by the calling function. This function returns (2) and (3) as entry dates. Graduation date is March 31 of the year in which the child would have been six years old by the following April 1.
// Here, "cbirth" is assumed to have the format "yyyy-mm-dd( HH:MM:SS)".
const getEntGradDates = (cbirth) => {
	const cb = cbirth// for shortening.
	// Parse the format.
	if(!cb.match(/\d{4}-\d{2}-\d{2}/)) return false

	// As the first case of the enrollment date, we get the date of 3yo birthday by the replecement of yera-part of "cb".
	// Unfortunately, it seems impossible to treat backreferences as numbers in JS regexp.
	// The last .replace method aligns the result to the only Ymd format.
	const bDay3yo = cb.replace(/^(\d{4})/, (+cb.slice(0, 4) + 3)).replace(/\s\d{2}:\d{2}:\d{2}/, '')

	// As the second case of entDate, we get the 1st day of the month following the month in which bday3 falls (call "folMth1").
	// However, we should remark that when the cbirth is in March or equal to Apr.1, folMth1 has no meaning, so we set it empty.
	let folMth1
	if(+cbirth.slice(5, 7) === 3 || (cbirth.slice(5, 10) === '0401')){
		folMth1 = ''
	}else{
		// "bDay3yo1" is easyly obtained as a string of bDay3yo with day part replced by '01'".
		// It's all right regardless of whether the original date has the time part( HH:MM:SS) or not.
		const bDay3yo1 = bDay3yo.replace(/\d{2}(\s|$)/, "01$1")
		// Once the bDay3yo1 is converted to a date-type.
		const dtBd3yo1 = new Date(bDay3yo1)
		// Then, the date of 1 month after dtBd3yo1 is obtained (with a name for shortening). 
		const dtFolMth1 = dtBd3yo1.setMonth(dtBd3yo1.getMonth() + 1)
		// And then we convert it back to the string again by "getYmd".
		// However, curiously, fM1 is of UNIXTIME type. So it is necessary to be converted to date type by new Data() before getYmd.
		folMth1 = getYmd(new Date(dtFolMth1))
	}

	// The third case of entDate is the April 1 of the next FY(school year). However, as it is not a functional value of cbirth, we don't include it in the return values.

	// Finally, we get "grad" that is the date of March 31 of the year in which the child is 6 yo as of the following April 1.
	// Obtaining the "school birthyear" (for cbirth), the year in which the child is 6yo as of the following April 1 is schBY + 7.
	// Then we get "gradDate" as March 31 of that.
	const grad = `${schBY(cbirth) + 7}-03-31`

	return {bDay3yo: bDay3yo, folMth1: folMth1, grad: grad}
}



// Create choices plus alpha for entDate and gradDate. It works for the addmission applications.
// For the admission on the next FY, it provides 3 periods for entDate. However, they are not always three options. Selection is only required for "bDay3" pattern.
// For the admission on this (current) FY, basically, it will be asked to select from dates after today. However, in the case of bDay3, the "minDate" is the later of bDay3yo and today.
// For gradDate, it always provides an input[type='hidden'] element with a value from "getEntGradDates" and there is no choice about it.
// Parameter "evt" is the event obtained as e.g. evtsResvs[eid].
const createEntDateChoicePlus = (cbirth, evt) => {
	// Get the candidates for entDate from his or her birth-date.
	const eGD = getEntGradDates(cbirth)

	// In the following, note that when eGD.folMth1 is empty (i.e. born in March or on Apr.1), folMth1 has no meaning, so there is no choice for that.

	let entDatePart
	if(evt.fyear === CUR_FY + 1){
		// Admission on the next FY (Usual case).
		if(+evt.bday3){
			if(eGD.folMth1.length){
				// Choice between bDay3yo and folMth1.
				entDatePart = `<div>
					<div class='remark'>
						入園日は「満3歳誕生日」, 「満3歳誕生日の翌月1日」のいずれかになります。選択してください。
					</div>
					<select id='entDate' onChange='dBDF()'>
					<option value=''>選択してください。</option>
					<option value='${eGD.bDay3yo}'>${eGD.bDay3yo}（満3歳誕生日）</option>
					<option value='${eGD.folMth1}'>${eGD.folMth1}（満3歳誕生日の翌月1日）</option>
					</select>
				</div>`
			}else{
				// bDay3yo is in March or equal to Apr.1 (i.e. fol1Mth1 is empty)
				entDatePart = `<div>
					入園日は${eGD.bDay3yo}（満3歳誕生日）となります。
					<input id='entDate' type='hidden' value='${eGD.bDay3yo}'>
				</div>`
			}
		}else{
			// When other than "bday3",
			entDatePart = `<div>
				入園日は${NEXT_APR1}（年度初日）となります。
				<input id='entDate' type='hidden' value='${NEXT_APR1}'>
			</div>`
		}
	}else if(evt.fyear === CUR_FY){
		// Admission on this FY
		// "minDate" is the first available date for entrance (admission). It is basically "today" except for the case of 3-year-old class. In case of 3yo class, it is the later of bDay3yo and today. But in the end, it will be the later of them anyway.
		const ymdToday = getYmd(dtNow)
		const minDate = ymdToday < eGD.bDay3yo? eGD.bDay3yo: ymdToday
		let reqStr
		if(+evt.bday3){
			reqStr = `以降から`
		}
		entDatePart = `<div>
			<div class='remark'>
				${ymdToday < eGD.bDay3yo? '満3歳誕生日': `${+evt.bday3? '既に満3歳になっておられますので': ''}本日`}以降から入園希望日を選択してください。<span class='font08 '>入園日については調整のため園から連絡をとらせていただくことがあります。</span>
			</div>
			<input id='entDate' type='date' min='${minDate}' onChange='dBDF()'>
		</div>`
	}

	// The whole html containing the above entDatePart.
	const entGradDatesChoice = `<div class='entDateChoice'>
		<div class='ttl'>★入園日</div>
		${entDatePart}
		<!-- There is no choice about the date of graduation. -->
		<input id='gradDate' type='hidden' value='${eGD.grad}'>
	</div>`
	return entGradDatesChoice
}



// Create html form for ENGLISH Course application. It works for the addmission applications.
const createEngCourseForm = (cbirth) => {
	// The FY when the target child may take ENGLISH Course is schoolBirthYear + 5
	const engCourseForm = `<div class='engCourseChoice'>
		<div class='ttl'>★ENGLISH Course</div>
		<div class='remark'>ENGLISH Course 受講希望について選択してください。</div>
		<select id='engCourse' onChange='dBDF()'>
			<option value='0'>ENGLISH Course の受講を申し込みません。</option>
			<option value='1'>${schBY(cbirth) + 5}年度 ENGLISH Course の受講を申し込みます。</option>
		</select>
	</div>`
	return engCourseForm
}



// Choices to add to the radio buttons for items that can be applied for.
// It is needed only when typs === 'aa'.
const dspAddlChoices = function(cbirth, eid){
	// Note that only the radio button that have been changed from deselected to selected will trigger a change event.
	// First, clear all additional choices.
	document.getElementsByName('addlChoices').forEach(el => el.innerHTML = '')
	const e = evtsResvs[eid]// for shortening.
	if(e.typ === 'aa'){
		// Additional choices
		let addlChoices = ''
		addlChoices += createEntDateChoicePlus(cbirth, e)
		// ENGLISH Course choice form is displayed only for the children with age 2 or 3 this year (i.e. the difference between schBY and CUR_FY is 3 or 4).
		if(CUR_FY - schBY(cbirth) === 3 || CUR_FY - schBY(cbirth) === 4){
			addlChoices += createEngCourseForm(cbirth)
		}
		document.getElementById(`addl_${eid}`).innerHTML = addlChoices
	}
}



// Join the outputs of chnResvs.createChnResvsHtml() in ASC or DESC order.
// if isAsc(==true), then ASC, else DESC.
const joinChnResvsHtml = (isAsc) => {
	// sort the array Object.keys(chnResvs) in ASC or DESC order of corresponding cbirth.
	// if isAsc == true then ASC. else, DESC.
	const sgn = isAsc? 1: -1
	const sorted = Object.keys(chnResvs).sort((x, y) => chnResvs[x].child.cbirth < chnResvs[y].child.cbirth? -sgn: sgn)
	// concaternate html's.
	let htBuf = ''// html-Buffer
	htBuf += `<div id='titleChnResvs'>子ども情報／予約状況</div>`
	for(let i = 0; i < sorted.length; i++){
		htBuf += chnResvs[sorted[i]].createChnResvsHtml()
	}
	htBuf += `<hr class='hrChild'><div class='outrAddChildInfo'><button class='toAddChildForm' onClick='makeForms("addChildForm");'>子ども情報の追加</button></div><br><br>`
	return htBuf
}



// ＊＊＊＊＊＊＊ 202108 NEW PART （ABOVE） ＊＊＊＊＊＊＊



const checkPastPtBoxes = (c) => {
	// c is a child (i.e, chnResvs[cid].child for some cid)
	const els = document.getElementsByName('pastpt')
	// For any string "str", !str is equivalent to (str === "" || str === null).
	if(!c.pastpt) c.pastpt = 'ft'
	for(let i = 0, len = els.length; i < len; i++){
		els[i].checked = c.pastpt.indexOf(els[i].value) >= 0? true: false
	}
}



// setModChildForm
// Set the actual values in modChild-form rendered by makeform(). 
const setModChildForm = (cid) => {
	curCid = cid// curCid: global
	const c = chnResvs[cid].child
	const ids = ['cid', 'clname', 'cfname', 'clname_k', 'cfname_k']
	for(let j = 0, len = ids.length; j < len; j++){
		document.getElementById(ids[j]).value = c[ids[j]]
	}
	document.getElementById('cbirth').value = c.cbirth.substr(0,10)
	const indexCsex = c.csex === 'm'? 0: 1
	document.getElementsByName('csex')[indexCsex].checked = true
	//arrange FiPastPt by current data.
	checkPastPtBoxes(c)
	// Add the button to delete this child-info.
	document.getElementById('btnCfmDelChild').innerHTML = `<button class='cfmDelChild' onClick='cfmDelChild("${c.cid}")'>子ども情報の削除</button><br>`
	scrollTo('phaseTitle')
	//console.log('ModChild() has called')
}





/* ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□ */
/* ■□■□■□■□■□ Prepare postData and Fetch □■□■□■□■□■ */

// "getValueChecked" is a function to get the value of the checked one among input[type="radio"]s with the same "name". In case no checked element is found, it returns false.
// Remark that the method getElementsByName() returns a HTMLCollection (not a simple array!) so we can not use for-loop or forEach for it.
const getValueChecked = (_name) => {
	const elems = document.getElementsByName(_name)
	for(let i = 0, len = elems.length; i < len; i++){
		if(elems[i].checked) return elems[i].value
	}
	return false
}



// Update the global variable "postData". "lcl" (local) is an additional object which updates a part of postData. Bur lcl does not update the global variables: uid, pw, ... etc.
const updatePostData = (ph, lcl) => {
	postData.phase = ph
	if(ph === 'regEmail'){
		email = postData.email = document.getElementById('email').value
	}else if(ph === 'sendPwResetUrl'){
		postData.email = lcl.email
		postData.uid = lcl.uid
	}else if(ph === 'login'){
		email = postData.email = uid? '': document.getElementById('email').value
		pw = postData.pw = document.getElementById('pw').value
	}else if(ph === 'autoLogin'){
		postData.phase = 'login'
		if(newPw) postData.pw = newPw
	}else if(ph === 'testNewEmail'){
		newEmail = postData.newEmail = document.getElementById('newEmail').value
	}else if(ph === 'chgEmail'){
		newEmail = postData.newEmail = document.getElementById('newEmail').value
	}else if(ph === 'chgPw'){
		pw = postData.pw = document.getElementById('pw').value
		newPw = postData.newPw = document.getElementById('newPw').value
	}else if(ph === 'resetPw'){
		newPw = postData.newPw = document.getElementById('newPw').value
	}else if(['regUser', 'modUser'].includes(ph)){
		if(ph === 'regUser'){
			// "newPw" updated here will be used in the immediately following 'autoLogin' phase.
			newPw = postData.newPw = document.getElementById('newPw').value
		}
		postData.ulname = document.getElementById('ulname').value
		postData.ufname = document.getElementById('ufname').value
		postData.ulname_k = document.getElementById('ulname_k').value
		postData.ufname_k = document.getElementById('ufname_k').value
		postData.hohequsr = document.getElementById('hohEqUsr').checked? 1: 0
		if(postData.hohequsr){
			postData.hlname = postData.ulname; postData.hfname = postData.ufname; postData.hlname_k = postData.ulname_k; postData.hfname_k = postData.ufname_k;
		}else{
			postData.hlname = document.getElementById('hlname').value
			postData.hfname = document.getElementById('hfname').value
			postData.hlname_k = document.getElementById('hlname_k').value
			postData.hfname_k = document.getElementById('hfname_k').value
		}
		postData.zipcode = document.getElementById('zipcode').value
		postData.prefecture = document.getElementById('prefecture').value
		postData.cityarea = document.getElementById('cityarea').value
		postData.street = document.getElementById('street').value
		postData.building = document.getElementById('building').value
		postData.uphone = document.getElementById('uphone').value
		postData.hphone = document.getElementById('hphone').value
		postData.scharea = document.getElementById('scharea').value
		postData.schareaplus = document.getElementById('schareaplus').value
	}else if(ph === 'addChild' || ph === 'modChild'){
		if(ph === 'modChild') postData.cid = document.getElementById('cid').value
		postData.clname = document.getElementById('clname').value
		postData.cfname = document.getElementById('cfname').value
		postData.clname_k = document.getElementById('clname_k').value
		postData.cfname_k = document.getElementById('cfname_k').value
		postData.cbirth = document.getElementById('cbirth').value
		postData.csex = document.getElementsByName('csex')[0].checked? 'm': 'f'
		const ppt = document.querySelectorAll('input[name=pastpt]:checked')
		postData.pastpt = [...Array(ppt.length)].map((_, i) => ppt[i].value).join(',')
		postData.ulname = user.ulname
		postData.ufname = user.ufname
	}else if(ph === 'delChild'){
		//postData.cid = document.getElementById('cid').value// curCid may also be OK.
		postData.cid = lcl.cid
	}else if(ph === 'addResv'){
		//postData.eid = $('[name=evtToReserve]:checked').val()
		const eidCkd = getValueChecked('evtToReserve')
		postData.eid = eidCkd
		postData.typ = document.getElementById('typ').value
		postData.cid = document.getElementById('cid').value
		const ppt = document.querySelectorAll('input[name=pastpt]:checked')
		postData.pastpt = [...Array(ppt.length)].map((_, i) => ppt[i].value).join(',')
		postData.comment = document.getElementById('comment').value
		// "posblKey" which takes value 'avbl' or 'wtbl' is for the reporting in the message (by postaData.posblKey) and the screen (by GL.posblKey).
		GL.posblKey = postData.posblKey = document.getElementById(`addl_${eidCkd}`).dataset.posblKey
		if(postData.typ === 'aa'){
			postData.entdate = document.getElementById('entDate').value
			postData.graddate = document.getElementById('gradDate').value
			postData.eng_course = document.getElementById('engCourse')? document.getElementById('engCourse').value: null
		}
	}else if(ph === 'delResv'){
		postData.rid = lcl.rid
		postData.cid = lcl.cid
		postData.typ = lcl.typ
		postData.eid = lcl.eid
		postData.wtngLen = lcl.wtngLen
		// The followings are prepared to inform the relevant of the advancement from "waiting" to "reserved".
		const e = evtsResvs[lcl.eid]
		postData.advUid = ''
		postData.advRid = ''
		// Note that advUid and advRid are impossible to be non-empty at the smae time.
		if(e.dedupe){
			// Deduped array of uids.
			const ddpdUids = Array.from(new Set(e.uids))
			if(ddpdUids.length > e.capacity) postData.advUid = ddpdUids[e.capacity]
		}else{
			if(e.rids.length > e.capacity) postData.advRid = e.rids[e.capacity]
		}
	}else if(['addResvForm', 'refreshAvblEvt'].includes(ph)){
		//postData = {phase: ph, email: email, uid: uid, pw: pw, typs: typs, utNow: utNow, basicUrl: basicUrl, priorTyp: priorTyp}
	}else if(ph === 'updFamState'){
		postData.cid = lcl.cid
		postData.fam_members = famMembers
		postData.fam_rel = famRel
	}else if(ph === 'updPortrait'){
		postData.cid = lcl.cid
		postData.newDataUrl = newDataUrl
	}else if(ph === 'modAdmApp'){
		postData.cid = curCid
		postData.fam_members = famMembers
		postData.fam_rel = famRel
	}else if(ph === 'delPortrait'){
		postData.cid = lcl.cid
	}else{
		postData.pw = ''
	}
	// For each value of the pbject "postData", convert NULL to an empty string.
	// This is a support for PHP8.
	Object.keys(postData).forEach(key => postData[key] = postData[key] ?? '')
}




// doFetch
// 'lcl' used to be 'parTyp', 'concatEid', 'parCid'.
const doFetch = (ph, lcl) => {
	// First, update postData.
	updatePostData(ph, lcl)

	// prepare options.
	const body = JSON.stringify(postData)
	const options = {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: body,
	}
	// ajax by fetch
	const url = QUERY_PATH
	fetch(url, options)
	.then(response => response.json())
	.then(data => {
		gData = data//global parameter for Debug
		// ====== For maintenance ======
		// gSqls = convPastpt(data.allpp)
		// =============================
		// prepare "typNames" if not yet.

		// Just after user-registration:
		if(ph === 'regUser'){
			// We execute doFetch again with pw = newPw (where newPw is a member of previous postData for doFetch('regUser')).
			doFetch('autoLogin')
		}
		// Define typNames: the intersection of types and typs.
		if(!Object.keys(typNames).length && data.types !== undefined){
			try{
				for(let i = 0, len = data.types.length; i < len; i++){
					if(typs == null || typs.split(',').includes(data.types[i].typ)){
						typNames[data.types[i].typ] = data.types[i].name
					}
				}
			}catch(e){
				console.log(e.message)
			}
		}
		// Not assume to be logged in.
		if(data.fuEvts !== undefined && data.fuResvs !== undefined){
			evts = typs === 'aa'? data.fuEvts.filter(x => x.typ === 'aa'): data.fuEvts
			//if(data.fuResvs !== undefined) resvs = data.fuResvs.filter(x => x.eid.substr(0, 2) in typNames)
			resvs = data.fuResvs? data.fuResvs: []
			evtsResvs = parseToEvtsResvs(evts, resvs)
		}
		if(data.ucr !== undefined && data.ucr.usrinf.loggedIn){// it must be logged in.
			user = data.ucr.usrinf.user
			// if uid (or email) is not given from URL（querystring).
			postData.uid = uid = uid || user.uid// Very important!!
			postData.email = email = email || user.email
			childrenExt = data.ucr.childrenExt
			children = childrenExt.filter(v => +v.valid)
			//If we use children1 which is an object indexed by cid's, then:
			//chnResvs = Object.keys(children1).reduce((o, cid) => (o[cid] = new ChildReservations(cid), o), {})
			// chnResvs stands for "children Reservations".
			if(resvs !== undefined && evtsResvs !== undefined){
				chnResvs = parseToChnResvs(children, resvs, evtsResvs)
			}
			// Remember that in JS, objects (containing "array") are stored and copied "by reference". Therefore, e.g. "famMembers" below is the same as "user.fam_members"(except initially).
			famMembers = user.fam_members
			if(!user.fam_members) initFamMembers()
			famRel = user.fam_rel
			if(!user.fam_rel) initFamRel()
		}
		// Execute "modifyScreen()"
		try{
			modifyScreen(ph, data, lcl)
		}catch(e){
			console.error(e)
		}
	})
	.catch((error) => {
		console.error('Error:', error)
	})
}



const scrollTo = (id) => {
	document.getElementById(id).scrollIntoView()
	//document.getElementById(id).scrollTop = 0
}



// modifyScreen
// to be executed in callback for fetch().
const modifyScreen = (ph, data, lcl) => {
	phase = ph
	msData = data//global parameter for Debug
	// Display event-evtSchedule (it need not be logged in).
	elem.evtSchedule.innerHTML = Object.keys(evtsResvs).length? createEvtsSchedHtml(evtsResvs): ''
	// Display Children Status and User information (it must be logged in).
	elem.main.innerHTML = (data.ucr !== undefined && data.ucr.usrinf.loggedIn)? joinChnResvsHtml(false) + dspUser(user): ''
	if(ph === 'regEmail'){// it need not be logged in.
		let htReport = '', htMessage = ''
		if(!data.result && data.report === 'validUserExists'){
			const url = `${location.origin}${location.pathname}`
			htReport = `<span class='font11 crimson'>メールドレス：<br><br>${email}<br><br>の利用者登録が既にあります！</span><br><br>`
			htMessage = `<br><span class='bold font10'>もしそれが貴方様による登録ならば、<br><br><div class='bold font11 blue'>［KG-CCS］ 利用者登録完了通知</div><br>という件名のメッセージを受信されているはずです。<br><br>ご不明な場合は管理者までお問い合わせください。</span><br><br><br><button class='full login' onClick='document.location="${url}";'>スタート画面に戻る</button></div>`
			console.log('The same email-address has already existed!')
		}else{
			htReport = `<span class='font06 mediumblue'>メールアドレスご登録ありがとうございます。</span><br><span class='font07 mediumblue'>通知メールを送信しました。</span><br><br><br><span class='font09 crimson'>利用者登録はまだ完了していません！</span><br><br><br><span class='font10'>届いたメールのURLを開いて<br>本登録を行ってください！</span>`
			htMessage = `<br><br/><span class='bold font10'>ご登録いただいたメールアドレス宛に</span><span class='red'>本登録用のURL</span><span class='bold font10'>を送信しました。そこから</span><span class='red'>本登録（利用者のご氏名、ご住所、…等の登録）</span><span class='bold font10'>を行ってください。</span><br><br><br><span class='red'>メールが届かない場合は、携帯端末等の受信制限設定が原因であることも考えられます。ご確認の上、再度メールアドレス登録を行ってください。</span>`
			console.log('Email registered!')
		}
		elem.report.classList.add('centerTitle', 'forestgreen')
		elem.report.innerHTML = htReport
		elem.message.innerHTML = htMessage
		elem.phaseTitle.innerHTML = ''
		elem.evtSchedule.innerHTML = ''
		elem.forms.innerHTML = ''
		elem.guide.innerHTML = ''
		elem.buttons.innerHTML = ''
	}else if(ph === 'sendPwResetUrl'){
		const htMessage = `<span class='bold fony12 crimson'>${data.result? "「パスワードリセット用URL通知」メールを送信しました。そのメールにあるURLを開いてパスワードリセットを実行してください。": data.report}</span>`
		elem.message.innerHTML = htMessage
		elem.report.innerHTML = ''
		elem.guide.innerHTML = ''
		elem.forms.innerHTML = ''
		elem.buttons.innerHTML = ''
		elem.footer.innerHTML = ''
		console.log('We send the URL to reset password.')
	}else if(ph === 'testNewEmail'){
		const htMessage = `<span class='bold font11 crimson'>${data.report}受信をご確認ください。</sapn>`
		elem.message.innerHTML = htMessage
		// Here, you must not erase the contents of elem.form!
		phase = 'chgEmailForm'// to display［変更］(not［送信］)
		window.setTimeout(() => {dBDF()}, 500)// display "［変更］" again.
		elem.evtSchedule.innerHTML = ''
		elem.main.innerHTML = ''
		console.log('New email has been tested!')
	}else if(ph === 'chgEmail'){
		console.log('data.ucr.usrinf.user.email: ' + data.ucr.usrinf.user.email)
		email = data.ucr.usrinf.user.email// new one which has got from the updated DB.
		const url = `${location.origin}${location.pathname}?email=${email}&uid=${uid}`
		let htMessage = `<div class='bold crimson'><span class='font11'>${data.report}</span><br><span class='font09'>スタート画面から再ログインしてください。</span><br><button class='full login' onClick='document.location="${url}";'>スタート画面へ</button></div>`
		htMessage += data.result? `<div class='bold font09 crimson'>「メールアドレス変更通知」に新たなログイン用 URL が掲載されています。</div>`: ''
		//htMessage += "<br><br><br>"
		elem.message.innerHTML = htMessage
		elem.evtSchedule.innerHTML = ''
		elem.forms.innerHTML = ''
		elem.main.innerHTML = ''
		elem.buttons.innerHTML = ''
		// Show the user state at the top of the screen.
		scrollTo('phaseTitle')
		console.log('Email changed!')
	}else if(['chgPw', 'resetPw'].includes(ph)){
		const url = `${location.origin}${location.pathname}?email=${email}&uid=${uid}`
		const htMessage = `<div class='bold crimson'><span class='font11'>${data.report}</span><br><br><span class='font09'>スタート画面から新たなパスワードで再ログインしてください。</span><br><button class='full login' onClick='document.location="${url}";'>スタート画面へ</button></div>`
		elem.message.innerHTML = htMessage
		elem.evtSchedule.innerHTML = ''
		elem.forms.innerHTML = ''
		elem.main.innerHTML = ''
		elem.buttons.innerHTML = ''
		// Show the user state at the top of the screen.
		scrollTo('phaseTitle')
		console.log('Password changed!')
	}else if(['start', 'refreshAvblEvt'].includes(ph)){
		elem.footer.innerHTML = ''
		//console.log('phase is "start" or "refreshAvblEvt"')
	}else if(ph === 'modUser'){
		htReport = `<span class='bold font11 crimson'>利用者情報を変更しました！</span>`
		elem.report.innerHTML = htReport
		elem.guide.innerHTML = ''
		elem.forms.innerHTML = ''
		elem.buttons.innerHTML = ''
		// Show the user state at the top of the screen.
		scrollTo('titleUser')
		console.log('User information modified!')
	}else if(ph === 'addChild'){
		// Display 'report' at the top of the screen.
		// window.location.hash = "report"
		htReport = `<span class='bold font11 crimson'>子ども情報を追加しました！</span>`
		elem.report.innerHTML = htReport
		elem.forms.innerHTML = ''
		elem.buttons.innerHTML = ''
		// Show the child state at the top of the screen.
		scrollTo('titleChnResvs')
		console.log('Child added!')
		// If it is after the user-registration:
		if(location.search.match(/regUserForm/)){
			window.setTimeout(() => {
				alert('\n子ども情報のご登録ありがとうございます！\n\nここで一旦ログアウトとなります。\n\nスタートページに戻りますので、再ログインをお願いいたします！')
				let url = location.href
				// Remove unnecessary (or Disturbing?) query parameters from url.
				url = url.replace(/pw=[^&]*&?/, '').replace(/phase=[^&]*&?/, '').replace(/(&|\?)$/, '')
				location.href = `${url}`
			}, 1000)
		}
		scrollTo('phaseTitle')
	}else if(ph === 'modChild'){
		htReport = `<span class='bold font11 crimson'>子ども情報を変更しました！</span>`
		elem.report.innerHTML = htReport
		elem.forms.innerHTML = ''
		elem.buttons.innerHTML = ''
		// Show the child state at the top of the screen.
		scrollTo('titleChnResvs')
		console.log('Child information modified!')
	}else if(ph === 'delChild'){
		htReport = `<span class='bold font11 crimson'>子ども情報を削除しました！</span>`
		elem.forms.innerHTML = ''
		elem.buttons.innerHTML = ''
		// Show the child state at the top of the screen.
		scrollTo('phaseTitle')
		console.log('Child deleted!')
	}else if(ph === 'updFamState'){
		htReport = `<span class='bold font11 crimson'>世帯の状況を更新しました！</span>`
		parseFamMembers(lcl.cid)
	}else if(ph === 'updPortrait'){
		setPortraitCtrl(lcl.cid, 'updPortrait')
	}else if(ph === 'delPortrait'){
		if(data.result){
			// Clear img.src
			// It is strange, but setting img.src=''(empty) often causes unintended result: img.src='https://www....'. img.src='//:0' seems to be the best option. But, ...
			document.getElementById('portImg').src = ''
			document.getElementById('portRegdImg').src = ''
			// (Re)Set captions and message.
			const elPortCap = document.getElementById('portCap')
			elPortCap.innerHTML = elPortCap.dataset.strNoImg
			document.getElementById('portRegdCap').innerHTML = ''
			const elPortMsg = document.getElementById('portMsg')
			elPortMsg.innerHTML = elPortMsg.dataset.strDeleted
		}
		// Return to modAdmAppForm
		setPortraitCtrl(lcl.cid, 'delPortrait')
	}else if(ph === 'addResv'){
		htReport = `<span class='bold font11 crimson'>${GL.posblKey === 'wtbl'? 'キャンセル待ち登録を': '予約'}しました！</span>`
		elem.report.innerHTML = htReport
		elem.forms.innerHTML = ''
		elem.buttons.innerHTML = ''
		scrollTo('phaseTitle')
	}else if(ph === 'delResv'){
		htReport = `<span class='bold font11 crimson'>${+lcl.wtngLen? 'キャンセル待ち登録': '予約'}を削除しました！</span>`
		elem.report.innerHTML = htReport
		scrollTo('phaseTitle')
	}else if(['login', 'autoLogin'].includes(ph)){
		elem.guide.innerHTML = ''
		const usrinf = data.ucr.usrinf
		if(!usrinf.emailExists){
			const htMessage = `<span class='bold fony12 crimson'>登録されていないメールアドレスのようです。利用者登録を行ってください。</span>`
			elem.report.innerHTML = ''
			elem.message.innerHTML = htMessage
			console.log('Email does not exist!')
		}else{// When the email exists:
			if(!usrinf.userExists){// If no user-registration:
				const htMessage = `<span class='bold fony12 crimson'>利用者登録が完了していないようです。既にお手元に届いている［KG-CCS］メールアドレス登録通知 のメールがあれば、そこに記載されたURLから本登録を行ってください。通知メールが見当たらない場合は、メールアドレス登録からやり直してください。</span>`
				elem.report.innerHTML = ''
				elem.message.innerHTML = htMessage
				console.log('Email exists, but user registration is not complete!')
			}else{// When the user exists:
				if(!usrinf.loggedIn){// In case password is incorrect:
					const htMessage = `<span class='bold fony12 crimson'>パスワードが正しくないようです。パスワードをお忘れの場合は［パスワード・リセット］を行ってください！</span>`
					elem.message.innerHTML = htMessage
					//elem.report.innerHTML = `${htReport}<br>`
					const url = location.origin + location.pathname + '?' + (email.length? `email=${email}`: ``) + (uid.length? `&uid=${uid}`: ``)
					elem.buttons.innerHTML = `<button class='full login' onClick='document.location="${url}";'>スタート画面へ</button><br>`
					elem.footer.innerHTML = guidePwReset
					console.log('Failed to log in!')
				}else{// It is assumed to be loged in.
					elem.phaseTitle.innerHTML = ''
					// Put logout-button.
					const htBtnLogout = `<button class='logout' onClick='makeForms("start"); doFetch("start")'>ログアウト</button>`
					elem.btnLogout.innerHTML = htBtnLogout
					// ↓　this may be for debug-needs.
					// htReport = `<div class='bold font09 seagreen'>logged in！［${user.uid}］</div>`
					// When children have not been registered yet:
					if(!Object.keys(children).length){
						const htGuide = `<button class='full login' onClick='makeForms("addChildForm");'>子ども情報の追加</button><br><span class='bold font09 crimson'>各プログラムはお子さまのお名前でご予約いただく形になりますので、必ず「子ども情報の追加」を行ってください。</span><br><span class='bold font09 seagreen'>子ども情報の追加は改めてログインしてからも行えます。</span>`
						elem.guide.innerHTML = htGuide
						// Just after user-registration:
						if(location.search.match(/regUserForm/)){
							// id='anchorRegUser' is for screen-scroll.
							const htReport = `<div id='anchorRegUser' class='font07'>ありがとうございます！</div><span class='font09'>利用者登録が完了しました。</span>`
							const htMessage = `<br><br><span class='bold font11 crimson'>利用者登録完了通知</span>メールを送信しました。そこに　<span class='bold font11 crimson'>${user.ulname}さま専用ログインURL</span>　があります。今後はそこからログインしていただけます<span class='bold font09'>（メールアドレスの入力が不要です）</span>。<br><br><br><br><span class='bold font13 crimson'>続いて「子ども情報の追加」をお願します！</span>`
							elem.report.classList.add('centerTitle', 'forestgreen')
							elem.report.innerHTML = htReport
							elem.message.innerHTML = htMessage
							//elem.forms.innerHTML = ''
							console.log('Logged in just after user registration!')
						}else{// After usual login:
							const htMessage = `<div class='bold font11 crimson'>まだお子さまが登録されていません。子ども情報の追加をお願いします！</div><br>`
							elem.message.innerHTML = htMessage
							//elem.forms.innerHTML = ''
							console.log('Logged in but "children" is empty!')
						}
						// move to the top of 'report'???
						scrollTo('phaseTitle')
					}else{
						elem.phaseTitle.innerHTML = `登録・予約状況`
						document.getElementById('title00').innerText = `${user.ulname}${user.ufname}さま／KG-CCS`
						console.log('Logged in as usual!')
					}
					elem.footer.innerHTML = ''
					elem.buttons.innerHTML = ''
				}
				elem.forms.innerHTML = ''
			}
		}
	}
	// When ph is 'login' or 'autoLogin', scroll to "startAt" if defined.
	if(startAt) scrollTo(startAt)
}



const cfmDelChild = (cid) => {
	const lcl = {cid: cid}
	if(confirm('子ども情報を削除してよろしいですか？')) doFetch('delChild', lcl)
}



const cfmDelResv = (rid, cid, typ, eid, wtngLen) => {
	const lcl = {rid: rid, cid: cid, typ: typ, eid: eid, wtngLen: wtngLen}
	if(confirm(`${+wtngLen? 'キャンセル待ち登録を削除': '予約を削除（キャンセル）'}してよろしいですか？［${cid}］`)) doFetch('delResv', lcl)
}



const cfmSendPwResetUrl = (emailOrUid) => {
	//email = parEmail
	const lcl = {}
	if(emailOrUid.match(/(^$|^[\w.\-]+@[\w\-]+\.[\w.\-]+$)/i)){
		lcl.email = emailOrUid; lcl.uid = ''
	}else if(emailOrUid.match(/^[0-9A-Fa-f]{11}/i)){
		lcl.email = ''; lcl.uid = emailOrUid
	}
	if(confirm('パスワード・リセット用メールを送信します\n\nよろしいですか？')) doFetch('sendPwResetUrl', lcl)
}




// Action after logged in.
const doAftLoggedIn = (qsAftLoggedIn) => {
	if(qsAftLoggedIn === 'change_password'){
		makeForms('chgPwForm')
	}else if(qsAftLoggedIn === 'change_mail_address'){
		makeForms('chgEmailForm')
	}
}




// Debug related

// Display debug report.
const dspDebugRep = (data) => {
	console.log('in dspDebugRep()')//★★★★★★★★
	let htDebugInfo = ''
	if(dspAdminInfo || data.extraAuth.length){
		// dbName and extraAuth
		const eAuth = data.extraAuth? `<br>extraAuth: ${data.extraAuth}`: ''
		htDebugInfo += `<div class='dbInfo'>DB: ${data.dbNameDisp}${eAuth}</div>`
		// Display dtNow when qsNow (from $_GET['now']) is given.
		if(!qsNow){
			const urlNow = location.href.replace(/now=[^&]*&?/, "").replace(/&$/, "")
			htDebugInfo += `<div class='dtNow'>★${getYmdHMS(dtNow)} 現在　を表示中！<br>　<span onClick='location.href="${urlNow}"'><u>現在の画面</u></span></div>`
		}
		elem.header.style.color = 'Crimson'
		elem.header.innerHTML = `<hr>${htDebugInfo}<div class='clearboth'></div><hr>`
	}
	// Set Background-Color
	//const baBgCol = '#dcfadc'
	const baBgCol = '#ffffff'
	const arrExBgCol = {Administrator: '#fadcdc', Developer: '#dcdcfa', SuperUser: '#fadca9'}
	const bgCol = data.extraAuth? arrExBgCol[data.extraAuth]: baBgCol
	document.getElementById('container').style.backgroundColor = bgCol
}



// ↓　Debug for "Date" of iOS.
const exDate = () => {
	const dtHy = '2020-09-01 00:00:00'
	const dtSl = '2020/09/01 00:00:00'
	let buf = ''
	buf += '- dtHy = ' + dtHy + '<br>'
	buf += '/ dtSl = ' + dtSl + '<br>'
	buf += '- new Date: ' + new Date(dtHy) + '<br>'
	buf += '/ new Date: ' + new Date(dtSl) + '<br>'
	buf += '- new Date getTime: ' + (new Date(dtHy)).getTime() + '<br>'
	buf += '/ new Date getTime: ' + (new Date(dtSl)).getTime() + '<br>'
	buf += '- Date.parse: ' + Date.parse(dtHy) + '<br>'
	buf += '/ Date.parse: ' + Date.parse(dtSl) + '<br>'
	buf += '- new Date T: ' + new Date(dtHy.replace(' ', 'T')) + '<br>'
	buf += '/ new Date T: ' + new Date(dtSl.replace(' ', 'T')) + '<br>'
	buf += '- new Date T +09:00: ' + new Date(dtHy.replace(' ', 'T') + '+09:00') + '<br>'
	buf += '/ new Date T +09:00: ' + new Date(dtSl.replace(' ', 'T') + '+09:00') + '<br>'
	buf += '- new Date T +0900: ' + new Date(dtHy.replace(' ', 'T') + '+0900') + '<br>'
	buf += '/ new Date T +0900: ' + new Date(dtSl.replace(' ', 'T') + '+0900') + '<br>'
	return buf
}




// For maintenance
// global parameter to store the value of convPastpt(allpp).
// Why global? Because we want to take it out from the Console of DevTools.
let gSqls

/* Make sql-sentences to convert each 'pastpt' in children from json-string to an only csv-string. i.e,
 *   a:4:{i:0;s:2:\"wk\";i:1;s:2:\"bc\";i:2;s:2:\"op\";i:3;s:2:\"be\";}
 *   →　"wk,bc,op,be"
 */
const convPastpt = (allpp) => {
	let sqls = ''
	for(let i = 0, len = allpp.length; i < len; i++){
		if(allpp[i].pastpt){
			sqls += `UPDATE children SET pastpt = '${allpp[i].pastpt}' WHERE cid = ${allpp[i].cid};_toReplace_`
		}
	}
	return sqls
}





// ■■■■■ Functions for initializing ■■■■■
// Create basic elements with parent element "root".
const createBasicElements = () => {
	// Object of elements indexed by id.
	const elem = {}

	// Create 'roor' element.
	const elRoot = document.createElement('div')
	elRoot.id = 'root'
	// Children of 'root' element.
	// In each array of element-id's, the order is important.
	const rootChildId = ['header', 'topLogo', 'classTitle', 'chgClass', 'evtSchedule', 'btnLogout', 'phaseTitle', 'report', 'message', 'guide', 'bothEnds', 'forms', 'main', 'buttons', 'footer', 'privacyPolicy', 'EXPT']
	for(let i = 0, len = rootChildId.length; i < len; i++){
		elem[rootChildId[i]] = document.createElement('div')
		elem[rootChildId[i]].id = rootChildId[i]
		elRoot.appendChild(elem[rootChildId[i]])
	}

	// 'topLogo' element and its children.
	const topLogChildId = ['logo0', 'logo1']
	for(let i = 0, len = topLogChildId.length; i < len; i++){
		elem[topLogChildId[i]] = document.createElement('div')
		elem[topLogChildId[i]].id = topLogChildId[i]
		elem.topLogo.appendChild(elem[topLogChildId[i]])
	}
	elem.topLogo.style.cssText = 'margin: 5px auto 27px auto; width: 100%; line-height: 0.9; text-align: center;'
	elem.logo0.style.cssText = 'font-weight: bold; font-size: 0.7em; color: palevioletred;'
	elem.logo0.innerHTML = '幼保連携型認定こども園'
	elem.logo1.style.cssText = 'margin-top: 2px; font-weight: bold; font-size: 0.9em; color: palevioletred;'
	elem.logo1.innerHTML = '清教学園幼稚園'

	// elem.classTittle and elem.phaseTitle have very similar styles.
	elem.classTitle.style.cssText = 'margin: 30px auto 40px auto; text-align: center; font-weight: bold; line-height: 1.4; color: hotpink;'
	//elem.classTitle.style.border = 'solid 1px blue'//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
	elem.phaseTitle.style.cssText = 'margin: 50px auto 15px auto; text-align: center; font-weight: bold; font-size: 1.6em; line-height: 1.4; color: forestgreen;'
	//elem.phaseTitle.style.border = 'solid 1px blue'//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
	elem.chgClass.style.cssText = 'margin: 20px auto 40px auto;'

	// btnLogout
	elem.btnLogout.style.cssText = 'margin: 0px; width: 100%;'
	//elem.btnLogout.style.border = 'solid 1px red'//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊

	// 'bothEnds' element and its children.
	const bothEndsChildId = ['userLFName', 'btnBackward']
	for(let i = 0, len = bothEndsChildId.length; i < len; i++){
		elem[bothEndsChildId[i]] = document.createElement('div')
		elem[bothEndsChildId[i]].id = bothEndsChildId[i]
		elem.bothEnds.appendChild(elem[bothEndsChildId[i]])
	}
	elem.bothEnds.style.cssText = 'display: flex; justify-content: space-between; margin: 30px 0 10px 0; width: 100%;'
	elem.userLFName.style.cssText = 'margin-right: auto; text-align: left; font-weight: bold; font-size: 0.8rem; color: royalblue;'
	elem.btnBackward.style.cssText = 'margin-left: auto; width: 4em; text-align: right;'

	return {elRoot: elRoot, elem: elem} 
}



//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
const HT_MSG_ABT_YUSEN_PRD = `<div>
	<div style='margin: 2rem auto; width: 100%;'>
		<div style='margin: 0px auto; width: 84%; text-align: left;'>
			<!--
			入園出願予約の受付期間は　9月29日（金）9:00 〜 10月1日（日）8:00　です。どうぞよろしくお願いいたします！<br><a href='https://seikyo-kg.com/guide/index.html'><span class='font09 hotpink'><br>ご予約後のスケジュールについては園サイト（詳細は募集要項）をご覧ください。</span></a>
			-->
			<div class='font10 dimgray'>
				<span class='font11 crimson'>
				★お知らせ<br>
				2023年度満3歳児&nbsp;</span>は出願数が定数に達しており、現在は <span class='font11 crimson'>キャンセル待ち登録</span> を承る形となります。キャンセル待ち登録をいただく際には［出願情報の登録］は不要です。
			</div>
		</div>
	</div>
	<!--
	<hr style='margin: 30px auto; width: 98%;'>
		<div style='text-align: left; font-weight: bold; font-size: 0.8rem; '>
			<span class='palevioletred'>&nbsp;&nbsp;出願情報の登録と出願予約は次の手順でお進めください。</span><br>
			<ul style='margin: 10px auto 10px 20px; color: steelblue;'>
				<li style='margin-bottom: 5px;'>当システムを初めて利用される場合は「メールアドレス登録」→「利用者登録」→「子ども情報（出願児童）の追加」までをお済ませください。</li>
				<li style='margin-bottom: 5px;'>当システムには、子育て支援プログラム予約、一時預かり保育（一般型）スマイル入会予約、入園出願予約の３種別があります。出願のためには必ず「入園出願予約」（ピンク）でログインしてください。</li>
				<li style='margin-bottom: 5px;'>このたび出願されるお子さまの［出願情報の登録］に入り、案内にしたがって「家族構成」，「住所・その他」，「出願児童の写真」をご登録ください。</li>
				<li>出願情報の登録が完了し、優先条件が満たされていると、ホーム画面に出願予約ボタンが表示されますので、予約をお済ませください。</li>
			</ul>
			<span class='palevioletred'>&nbsp;&nbsp;お手間をおかけいたしますが、何卒よろしくお願いいたします。</span>
		</div>
	-->
	<hr style='margin: 20px auto; width: 98%;'>
</div>`
//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊




// "Classes" (i.e. AD-class, PR-class, CCS-class) are divisions that are even higher than types (i.e. aa, pr, wk, bc, er, op, be, ce).
// Print different classTitles depending on whether typs and priorTyp ('aa', 'pr' or else).
const printHtClassTitle = (typs, priorTyp) => {
	// Is it［優先受付］？ (ver.2022)
	const adYusen = (priorTyp === 'aa' && (new Date('2022/10/01 00:00:00')) <= dtNow)? '［優先受付］': ''
	const prYusen = (priorTyp === 'pr' && (new Date('2022/11/01 00:00:00')) <= dtNow)? '［優先受付］': ''
	if(typs === 'aa'){
		return `<span class='aa font17'>入園出願予約${adYusen}</span>${HT_MSG_ABT_YUSEN_PRD}`
	}else if(typs === 'pr'){
		return `<span class='pr font13'>一時預かり保育（一般型）<br>『スマイル』入会予約${prYusen}</span>`
	}else{
		return `<span class='ccs font15'>子育て支援プログラム</span>`
	}
}




// ■■■■■ Initializing ■■■■■
const initialize = () => {
	// "createBasicElements" returns root-element and the object of basic elements.
	const res = createBasicElements()
	// For the time being, the parent of "elRoot" is "<div id='chararea'></div>", but will be changed to "<body>"（document.body as an element）.
	document.getElementById('chararea').appendChild(res.elRoot)
	elem = res.elem

	// Arrange "typs" (target types).
	// If "typs" is empty, it shall be all types of CCS class.
	typs = qsTyps? qsTyps: 'wk,bc,er,op,be,ce'
	// "typs" is set to only 'aa' if it contains 'aa', or only 'pr' if it does not contain 'aa' and contains 'pr'. Othrewise, "addTyps" will just be added.
	if(typs.split(',').includes('aa')){
		typs = 'aa'
	}else if(typs.split(',').includes('pr')){
		typs = 'pr'
	}else{
		typs += (!qsAddTyps? ',' + qsAddTyps: '')
	}

	// About Priority for 'aa' or 'pr'.
	const AD_PRIOR_PP = 'QhU$CsmYS 3SU@f8TRw'
	const AD_PRIOR_FWD_DAYS = 25

	const PR_PRIOR_PP = 'kP72Feu4M@s83$VcwA'
	const PR_PRIOR_FWD_DAYS = 14

	if(qsPriorPassphrase === AD_PRIOR_PP){
		priorTyp = 'aa'
		priorFwdDays = AD_PRIOR_FWD_DAYS
	}else if(qsPriorPassphrase === PR_PRIOR_PP){
		priorTyp = 'pr'
		priorFwdDays = PR_PRIOR_FWD_DAYS
	}

	// "dtNow" (datetime of Now). It is declaired globally.
	// If qsNow is given (i.e. qsNow is neither zero nor an empty string), then dtNow is set to that, otherwise, to true now.
	dtNow = qsNow.length? new Date(qsNow): new Date()
	// Furthermore, if priority is set, then dtNow is moved forward by "priorFwdDays".
	if(priorFwdDays) dtNow.setDate(dtNow.getDate() + priorFwdDays)

	// "utNow" (unixtime for "dtNow"). It is declaired globally.
	utNow = dtNow.getTime()

	const htClassTitle = printHtClassTitle(typs, priorTyp)
	elem.classTitle.innerHTML = htClassTitle

	// Initialize "postData" by the initial global variables or null.
	
	for(let key of POST_DATA_KEYS){
		postData[key] = GLOBALS.includes(key)? eval(key): null
	}

	fI = new FormItem(phase, typs)

	makeForms(phase)

	// doFetch
	if(phase === 'start'){
		if((uid.length || email.length) && pw.length){
			doFetch('autoLogin')
		}else{
			doFetch(phase)
		}
	}

	// set inPriorityPeriod
	const utPP0 = (new Date('2023-09-25 00:00:00')).getTime()
	const utPP1 = (new Date('2023-09-29 09:00:00')).getTime()
	inPriorityPeriod = (utPP0 < utNow && utNow < utPP1)? true: false

}





/******* Excecute Main ******/
initialize()
/****************************/
