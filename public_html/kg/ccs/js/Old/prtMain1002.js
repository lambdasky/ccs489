/*
 * prtMain.js
 */



// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□■□■□ Constants □■□■□■□■□■□■□■

// The applicaton form provided by Kawachinagano-shi has width 178mm and height 279mm in A4 paper. We prepare an object "prt" in the main process for some parameters for printing.
// prt.scaleX and prt.scaleY (both 1.0 by default) are coefficients for width and height fine-tuning respectively. And prt.offsetX and prt.offsetY (both in mm, 10 by default) are the margins literally.
// The following PRT is the constant which has default values.
let PRT = {offsetX: 0, offsetY: 0, scaleX: 1.00, scaleY: 0.90}



const PRT_STYLE = `<style>
/* appRoot only acts as the root-class for BenfCertApp */
/* The specific styles are written inline in the HTML. */
// resvRel's (data)

html{
	font-size: 100%;
	height: 100%;
	overflow: auto;
	background-color: white;
}

body{
	margin: 0;
	min-height: 100%;
	line-height: 1.4;
	background-color: inherit;
	font-family: 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3', Meiryo, メイリオ, Osaka, 'MS PGothic', arial, helvetica, sans-serif;*/
	/*font-family: 游ゴシック体, 'Yu Gothic', YuGothic, 'ヒラギノ角ゴシック Pro', 'Hiragino Kaku Gothic Pro', メイリオ, Meiryo, Osaka, 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif;*/
	font-size: 0.86rem;
	-webkit-text-size-adjust: none;
}

a{text-decoration: none;}
a:hover{text-decoration: underline;}

#root{
	margin: 0 0 0 19mm;
}

.appRoot * {
	margin 0;
	box-sizing: border-box;
	color: black;
}

.appRoot table{
	border-collapse: collapse;
}

.appRoot table tr td{
	text-align: center;
	border: 1px solid #000000; 
	font-size: 0.9rem;
}

.bgGray{
	background-color: silver;
}

@media print{
	#EXPT{
		display: none;
	}
}

</style>`



// Page Break
const HT_PAGE_BREAK = "<div style='display: block; break-after: page; visibility: hidden;'>XXXX</div>"


// For Debug
// border-width
let bWd = 0

// Global "Posted message"
let gMsg


// Instances of Intl.DateTimeFormat.
// Creating instances of Intl.DateTimeFormat is heavy load, so we will use them around.
const DATE_TIME_FORMAT = new Intl.DateTimeFormat()

const DATE_TIME_FORMAT_JP = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
	era: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
})


// elEXPT is an element for experiments.
const elEXPT = document.getElementById('EXPT')



// Current FY (Fiscal Year = School Year)
const CUR_FY = (() => {
	const dtNow = new Date()
	return dtNow.getFullYear() + (dtNow.getMonth() < 3? -1: 0)
})()



// October 1 of current FY in the format "Y-m-d".
const CUR_OCT1 = `${CUR_FY}-10-01`





// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□■□■□ Functions □■□■□■□■□■□■□■

// Convert Hiragara to Katakana in a string adding 0x60 in the Unicode Character.
// Remark that the range of Hiragana in the Unicode Table starts with ぁ（0x3041）, not あ（0x3042）. Also, at the end of the range, ん（0x3093）is fallowed by three chracters ゔ（0x3094）, ゕ（0x3095）, ゖ（0x3096）, the inclusion of which will not result in the string replacement in javascript.
const hiraToKata = (str) => str.replace(/[ぁ-ゖ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60))



// Convert the date with a string format (e.g. "2023-09-21 00:00:00") into Japanese calendar.
// "sp" is the spacing string which is placed on both sides of the numbers.
const strDateToJpCal = (ymd, sp) => {
	return DATE_TIME_FORMAT_JP.format(new Date(ymd)).replace(/(\d+)/g, `${sp}$1${sp}`)
}



const strDateToJpYyyyCal = (ymd, sp) => {
	return DATE_TIME_FORMAT.format(new Date(ymd)).replace(/\//, `${sp}年${sp}`).replace(/\//, `${sp}月${sp}`).replace(/$/, `${sp}日`)
}



// Get his or her "School Birthyear" from the birthdate. Those born between April 2 and April 1 of the following year will have the same schBirthYear. Those with the same schBirthYear have the same age as of April 1 of each year.
// Here "birth" is assumed to hava the format "yyyy-mm-dd HH:NMM:SS".
const schBirthYear = (birth) => {
	return +birth.slice(0, 4) + ((+birth.slice(5, 7) < 4 || birth.slice(5, 10) === '04-01')? -1: 0)
}





// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□■□■□■□ "getSibRsStr", "getRsStr", etc. from CCS/js/main.js □■□■□■□■□■□■

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





// ■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■□■
// ■□■□■□ Application for Certification of Benefits □■□■□■

/* For 96 ppi, the edges of A4 paper have length:
 * A4 Long edge:  297mm * 96px / 25.4mm = 1122.52px
 * A4 Short edge: 210mm * 96px / 25.4mm =  793.70px
 * However, when actually measured, the resolution is abt 3.8ppm (i.e abt 96.52ppi).
 */



// Creating an Admission Application for a child.
// "prt" is the object of parameters for printing.
const createAdmApp = (resvRel, prt, pageNum) => {
	// Date of application.
	const dtNow = new Date()
	const submiss = {year: dtNow.getFullYear(), month: dtNow.getMonth() + 1, date: dtNow.getDate()}

	// Html of the Admission Application.
	const rR = resvRel// for shortening.

	const rx = prt.scaleX
	// "hmNum" is the number of housemates (except the target child)
	const hmNum = rR.fam_members.length - 1
	// When hmNum > 5, adjustmaent of the whole height (i.e. abt 279 * scaleY) is required.
	// The adjusted ry is such taht (279 + 10(hmNum - 5))ry = 279scaleY. That is, the new ry is ...
	const ry = hmNum > 5? prt.scaleY * 279 / (10 * hmNum + 229): prt.scaleY

	// First, we prepare the Family-Member rows, extracting the data needed elsewhere.
	// Family members are output just in the middle of this application form, not at the top. However, the for loop in the process can be used to obtain various values.

	// Obtain family table rows while extracting various data.
	cnt = 0
	const hoh = {lname: '', fname: '', lname_k: '', fname_k: '', rsStr: '', sex: ''}
	let fmRows, fPhone, mPhone, fxdPhone
	fmRows = fPhone = mPhone = fxdPhone = ''
	for(let i = 0, len = rR.fam_members.length; i < len; i++){
		const fm = rR.fam_members[i]
		const rsStr = getRsStr(fm.fmBirth, fm.fmSex, fm.fmRs, rR.cbirth)
		// In case of hoh:
		if(+fm.fmHoh){
			hoh.lname = fm.fmLname
			hoh.fname = fm.fmFname
			hoh.lname_k = fm.fmLname_k
			hoh.fname_k = fm.fmFname_k
			hoh.sex = fm.fmSex
			hoh.rsStr = rsStr
		}
		// In case of father or mother:
		if(rsStr === '父' && fm.fmPhone.length && fm.fmPhone.match(/^\d{3}\-/) !== null){
			fPhone = fm.fmPhone
		}else if(rsStr === '母' && fm.fmPhone.length && fm.fmPhone.match(/^\d{3}\-/) !== null){
			mPhone = fm.fmPhone
		}
		// Incase of fixed phone:
		if(fm.fmPhone.match(/^\d{4}\-/) !== null){
			fxdPhone = fm.fmPhone
		}
		// Increment "cnt" except for the target.
		cnt++
		// Add to fmRows.
		fmRows += `<tr>
			<td style='width: ${60 * rx}mm; height: ${11 * ry}mm;'>
				<div style='display: flex; align-items: flex-start; justify-content: center; margin: 0 auto;'>
					<div style='text-align: left;'>
						<div style='font-size: 0.8em;'>${fm.fmLname_k}</div>
						<div>${fm.fmLname}</div>
					</div>
					<div style='visibility: hidden;'>-</div>
					<div>
						<div style='font-size: 0.8em;'>${fm.fmFname_k}</div>
						<div style=''>${fm.fmFname}</div>
					</div>
				</div>
			</td>
			<td style='width: ${18 * rx}mm; height: ${11 * ry}mm; font-size: 0.9em;'>
				${rsStr}
			</td>
			<td style='width: ${35 * rx}mm; height: ${11 * ry}mm; padding-left: ${5 * rx}mm; text-align: left; font-size: 0.9em;'>
				${strDateToJpYyyyCal(fm.fmBirth, '')}
			</td>
			<td style='width: ${12 * rx}mm; height: ${11 * ry}mm; font-size: 0.9em;'>
				${fm.fmSex === 'f'? '女': '男'}
			</td>
			<td style='width: ${45 * rx}mm; height: ${11 * ry}mm; font-size: 0.9em;'></td>
		</tr>`
	}
	// Obtain the real height (clientHeight) of famRows.
	elEXPT.innerHTML = `<table id='famRows'>${fmRows}</table>`
	const cHFamRows = elEXPT.clientHeight
	//console.log(`${rR.clname}${rR.cfname}: ${cHFamRows}`)
	elEXPT.innerHTML = ''

	// When the htFamRows (obtained above) is less than 136px, we add one blank row for height adjustment.
	if(cHFamRows < 136){
		fmRows += `<tr>
			<td style='width: ${60 * rx}mm; height: ${11 * ry}mm;'></td>
			<td style='width: ${18 * rx}mm; height: ${11 * ry}mm;'></td>
			<td style='width: ${35 * rx}mm; height: ${11 * ry}mm;'></td>
			<td style='width: ${12 * rx}mm; height: ${11 * ry}mm;'></td>
			<td style='width: ${45 * rx}mm; height: ${11 * ry}mm;'></td>
		</tr>`
	}

	// Family Members
	const htFamMem = `<div id='aaFamMem_${rR.cid}' style='margin: 0;'>
		<table>
			<tr>
				<td colspan='5' style='width: ${170 * rx}mm; height: ${8 * ry}mm; font-size: 0.9em;'>
					家　族　構　成<span style='font-size: 0.9em;'>（本人も含む）</span>
				</td>
			</tr>
			<tr>
				<td style='width: ${60 * rx}mm; height: ${9 * ry}mm; font-size: 0.8em;'>氏 名（ふりがな）</td>
				<td style='width: ${18 * rx}mm; height: ${9 * ry}mm; font-size: 0.75em;'>対象児童<br>との続柄</td>
				<td style='width: ${35 * rx}mm; height: ${9 * ry}mm; font-size: 0.8em;'>生 年 月 日</td>
				<td style='width: ${12 * rx}mm; height: ${9 * ry}mm; font-size: 0.8em;'>性 別</td>
				<td style='width: ${45 * rx}mm; height: ${9 * ry}mm; font-size: 0.8em;'>備 考</td>
			</tr>
			${fmRows}
		</table>
	</div>`
	
	// Header part containing Title, Date, Receipt-Number and Portrait.
	// The receipt number "rcptNum" is obtained from the school birth year.
	const rcptNum = 1000 * (6 - (CUR_FY - schBirthYear(rR.cbirth))) + rR.erid
	const htHeader = `<div id='aaHeader_${rR.cid}' style='margin: 21mm auto 0 0; width: ${170 * rx}mm; display: flex; align-items: flex-start; justify-content: start; border: ${bWd}px solid blue;'>
		<div>
			<div style='font-size: 1.0em;'>
				${rR.fyear}年度
			</div>
			<div style='margin: ${15 * ry}mm auto auto 0; width: ${68 * rx}mm; height: auto; font-weight: bold; font-size: 2.2rem; border: ${bWd}px solid green;'>
				<span style='vertical-align: top;'>入&nbsp;&nbsp;園&nbsp;&nbsp;願&nbsp;&nbsp;書</span>
			</div>
		</div>
		<div style='margin: ${25.5 * ry}mm ${2 * rx}mm auto 0;'>
			<table>
				<tr>
					<td colspan='2' style='width: ${50 * rx}mm; height: ${7 * ry}mm; text-align: center; font-weight: normal; font-size: 0.9rem;'>
						<span style='vertical-align: middle;'>受 付 番 号</span>
					</td>
				</tr>
				<tr>
					<td style='width: ${25 * rx}mm; height: ${17 * ry}mm; vertical-align: middle;'>
						${rcptNum}
					</td>
					<td style='width: ${25 * rx}mm; height: ${17 * ry}mm; vertical-align: middle;'>
						
					</td>
				</tr>
			</table>
		</div>
		<div style='margin: 0; width: ${50 * rx}mm; height: ${50 * ry}mm; text-align: center; border: 1px dashed dimgray;'>
			<img id='pr_${rR.uid}_${rR.cid}' style='width: 35mm;'>
		</div>
	</div>`

	// Main part containing the target child, parent, address, etc.
	const schArea = rR.schareaplus.length? rR.schareaplus: rR.scharea
	// "addrPCS" is address of prefevture, cityarea and street.
	const addrPCS = rR.prefecture + rR.cityarea + rR.street
	const strBld = rR.building? rR.building: ''
	// When the length of address > 40, the line will be broken before strBld
	const varBr = (addrPCS + strBld).length > 28? '<br>': ''
	// Phones (array)
	let arrPh = []
	if(fxdPhone.length) arrPh.push(`${fxdPhone}（自宅）`)
	if(fPhone.length) arrPh.push(`${fPhone}（父）`)
	if(mPhone.length) arrPh.push(`${mPhone}（母）`)
	let phones = ''
	if(arrPh.length) phones = `<br><span style='font-size: 0.85em;'>${arrPh.join('，')}</span>`

	// Remark that we obtain the "grdStr" (学年(名称)) from the string of event-title.
	const grdStr = (rR.apr1age === 2 && !rR.nursery)? '満3歳児': `${rR.apr1age}歳児`

	const htMain = `<div id='aaMain_${rR.cid}' style='margin: ${5 * ry}mm auto 0 0;'>
		<table>
			<tr>
				<td style='width: ${15 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'></td>
				<td style='width: ${45 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>氏 名<span style='font-size: 0.9em;'>（ふりがな）</span></td>
				<td style='width: ${35 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>生 年 月 日</td>
				<td style='width: ${10 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>性別</td>
				<td style='width: ${20 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>学 年</td>
				<td style='width: ${45 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>小 学 校 区</td>
			</tr>
			<tr>
				<td style='width: ${15 * rx}mm; height: ${13 * ry}mm'>児童</td>
				<td style='width: ${45 * rx}mm; height: ${13 * ry}mm'>
					<div style='display: flex; align-items: flex-start; justify-content: center; margin: 0 auto;'>
						<div style='text-align: left;'>
							<div style='font-size: 0.7em;'>${rR.clname_k}</div>
							<div>${rR.clname}</div>
						</div>
						<div style='visibility: hidden;'>-</div>
						<div>
							<div style='font-size: 0.7em;'>${rR.cfname_k}</div>
							<div style=''>${rR.cfname}</div>
						</div>
					</div>
				</td>
				<td style='width: ${35 * rx}mm; height: ${13 * ry}mm; font-size: 0.9em;'>
					${strDateToJpYyyyCal(rR.cbirth, '')}
				</td>
				<td style='width: ${10 * rx}mm; height: ${13 * ry}mm; font-size: 0.9em;'>
					${rR.csex === 'f'? '女': '男'}
				</td>
				<td style='width: ${20 * rx}mm; height: ${13 * ry}mm; font-size: 0.9em;'>
					${grdStr}
				</td>
				<td style='width: ${45 * rx}mm; height: ${13 * ry}mm; font-size: 0.9em;'>
					<div style='font-size: 0.9em;'>
						${schArea.length > 12? schArea.replace('小学校', '<br>小学校'): schArea}
					</div>
				</td>
			</tr>
		</table>
		<table>
			<tr>
				<td style='width: ${15 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'></td>
				<td style='width: ${45 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>氏 名<span style='font-size: 0.9em;'>（ふりがな）</span></td>
				<td style='width: ${15 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>続 柄</td>
				<td style='width: ${95 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>現住所，連絡先</td>
			</tr>
			<tr>
				<td style='width: ${15 * rx}mm; height: ${13 * ry}mm'>
					<div style='line-height: ;'>
						<span style='font-size: 0.9em'>保護者</span><br>
						<span style='font-size: 0.7em'>（世帯主）</span>
					</div>
				</td>
				<td style='width: ${45 * rx}mm; height: ${13 * ry}mm'>
					<div style='display: flex; align-items: flex-start; justify-content: center; margin: 0 auto;'>
						<div style='text-align: left;'>
							<div style='font-size: 0.8em;'>${hoh.lname_k}</div>
							<div>${hoh.lname}</div>
						</div>
						<div style='visibility: hidden;'>-</div>
						<div>
							<div style='font-size: 0.8em;'>${hoh.fname_k}</div>
							<div style=''>${hoh.fname}</div>
						</div>
					</div>
				</td>
				<td style='width: ${15 * rx}mm; height: ${13 * ry}mm; font-size: 0.9em;'>
					${hoh.rsStr}
				</td>
				<td style='width: ${95 * rx}mm; height: ${13 * ry}mm; padding-left: ${3 * rx}mm; font-size: 0.9em;'>
					<div style='display: inline-block; text-align: left;>
						<span style='font-size: 0.8em;'>〒 ${rR.zipcode}</span><br>${addrPCS}${varBr}${strBld}${phones}
					</div>
				</td>
			</tr>
		</table>
	</div>`

	// Finding the total clientHeight of all HTML up to this point, we determine the height (in mm) of the last division ("htSignature").
	elEXPT.insertAdjacentHTML('beforeend', `${htHeader}${htMain}${htFamMem}`)
	//console.log(`cHUpToThisPoint: ${elEXPT.clientHeight}`)
	const cHSignature = 267 - elEXPT.clientHeight * 25.4 / 96// 267mm is the height of "root".
	//console.log(`cHSignature: ${cHSignature}`)
	elEXPT.innerHTML = ''

	// Application (Signature) date
	const appDate = rR.created_at < CUR_OCT1? CUR_OCT1: rR.created_at
	// Signature
	// Note that the whole height is given in pixels.
	// In the "htSignature", all the vertical length (containing margins and spaces) are scaled by "sry" = cHSignature / 102, where "102" is the standart length of htSignature.
	const sry = cHSignature / 102
	const htSignature = `<div id='aaSignature_${rR.cid}' style='position: relative; width: ${170 * rx}mm; height: ${cHSignature * ry}mm; border: 1px solid black;'>
		<div style='margin: ${10 * sry}mm 0 0 ${10 * rx}mm; width: ${150 * rx}mm; height: ${10 * sry}mm; text-align: left; border: ${bWd}px solid crimson;'>
			上記児童の入園を希望します。<br>
			入園後は保護者として貴園の教育および保育の方針に従います。
		</div>
		<div style='margin: ${15 * sry}mm auto 0 ${25 * rx}mm; width: ${145 * rx}mm; text-align: left; font-size: 1.0em; border: ${bWd}px solid crimson;'>
			${strDateToJpYyyyCal(appDate, '&nbsp;')}
		</div>
		<div style='margin: ${6 * sry}mm auto 0 ${50 * rx}mm; width: ${120 * rx}mm; text-align: left; border: ${bWd}px solid crimson;'>
			保 護 者 氏 名　　<span style='font-size: 1.2em;'>${hoh.lname}　${hoh.fname}</span>
		</div>
		<div style='position: absolute; bottom: ${8 * sry}mm; right: ${10 * rx}mm; width: 90%; text-align: right; border: ${bWd}px solid crimson;'>
			学校法人清教学園 幼保連携型認定こども園<br>
			<span style='font-size: 1.2em;'>清教学園幼稚園　園長</span>　殿
		</div>
	</div>`

	const pageApp = `<div id='page_${pageNum}' class='appRoot' style='margin-left: ${prt.offsetX}px; margin-top: ${prt.offsetY}px; width: ${170 * rx}mm; height: auto; font-family: serif; font-size: 0.92rem; color: #000000; border: ${bWd}px dashed dimgray;'>
		${htHeader}
		${htMain}
		${htFamMem}
		${htSignature}
	</div>`

	return pageApp
}



// Creating an Benefit Certification Application for a child.
// "prt" is the object of parameters for printing.
const createBenfCertApp = (resvRel, prt, pageNum) => {
	// Date of application.
	const dtNow = new Date()
	const submiss = {year: dtNow.getFullYear(), month: dtNow.getMonth() + 1, date: dtNow.getDate()}

	// Html of the Benefit Certification Application.
	const rR = resvRel// for shortening.

	const rx = prt.scaleX
	// "hmNum" is the number of housemates (except the target child)
	const hmNum = rR.fam_members.length - 1
	// When hmNum > 5, adjustmaent of the whole height (i.e. abt 279 * scaleY) is required.
	// The adjusted ry is such taht (279 + 10(hmNum - 5))ry = 279scaleY. That is, the new ry is ...
	const ry = hmNum > 5? prt.scaleY * 279 / (10 * hmNum + 229): prt.scaleY

	// First, we prepare the "Family(Household) State" table, extracting the data needed elsewhere.
	// It is the third table in the application, not the first. However, the for-loop in the process of creating it can be used to retrieve a variety of values.

	// Creating the table rows for family members.
	cnt = 0
	let fmRows, fLFname, mLFname, fxdPhone, fPhone, mPhone, hohLFname
	fmRows = fLFname = mLFname = fxdPhone = fPhone = mPhone = hohLFname = ''
	for(let i = 0, len = rR.fam_members.length; i < len; i++){
		const fm = rR.fam_members[i]
		if(+fm.fmHoh){
			hohLFname = `${fm.fmLname}　${fm.fmFname}`
		}
		const rsStr = getRsStr(fm.fmBirth, fm.fmSex, fm.fmRs, rR.cbirth)
		if(rsStr === '父'){
			fLFname = `${fm.fmLname}　${fm.fmFname}`
			if(fm.fmPhone.length && fm.fmPhone.match(/^\d{3}\-/) !== null){
				fPhone = fm.fmPhone
			}
		}else if(rsStr === '母'){
			mLFname = `${fm.fmLname}　${fm.fmFname}`
			if(fm.fmPhone.length && fm.fmPhone.match(/^\d{3}\-/) !== null){
				mPhone = fm.fmPhone
			}
		}
		if(fm.fmPhone.match(/^\d{4}\-/) !== null){
			fxdPhone = fm.fmPhone
		}
		if(rsStr === '本人'){
			// Do not display the target child in the Housemate Table of BenfCertApp.
			continue
		}
		// Increment "cnt" except for the target.
		cnt++
		fmRows += `<tr>
			<td style='width: ${53 * rx}mm; height: ${10 * ry}mm; padding-left: ${14 * rx}mm; text-align: left;'>
				<div style='display: flex; align-items: flex-start; justify-content: start; margin: 0 auto;'>
					<div>
						<div style='font-size: 0.8em;'>${hiraToKata(fm.fmLname_k)}</div>
						<div>${fm.fmLname}</div>
					</div>
					<div style='visibility: hidden;'>-</div>
					<div>
						<div style='font-size: 0.8em;'>${hiraToKata(fm.fmFname_k)}</div>
						<div style=''>${fm.fmFname}</div>
					</div>
				</div>
			</td>
			<td style='width: ${17.5 * rx}mm; height: ${10 * ry}mm;'>
				${rsStr}
			</td>
			<td style='width: ${49 * rx}mm; height: ${10 * ry}mm; padding-left: ${8 * rx}mm; text-align: left; font-size: 0.9em;'>
				${strDateToJpCal(fm.fmBirth, '&nbsp;')}
			</td>
			<td style='width: ${22.5 * rx}mm; height: ${10 * ry}mm;'>
				${fm.fmSex === 'f'? '女': '男'}
			</td>
			<td style='width: ${36 * rx}mm; height: ${10 * ry}mm;'></td>
		</tr>`
	}
	// There are a total of 5 family columns, so we make up the remaining blanks.
	for(let i = 0; i < 5 - cnt; i++){
		fmRows += `<tr>
			<td style='width: ${53 * rx}mm; height: ${10 * ry}mm;'></td>
			<td style='width: ${17.5 * rx}mm; height: ${10 * ry}mm;'></td>
			<td style='width: ${49 * rx}mm; height: ${10 * ry}mm;'></td>
			<td style='width: ${22.5 * rx}mm; height: ${10 * ry}mm;'></td>
			<td style='width: ${36 * rx}mm; height: ${10 * ry}mm;'></td>
		</tr>`
	}

	// Family state (members and related)
	const fr = rR.fam_rel// for shortening.
	const htFamState = `<div id='bcaFamState_${rR.cid}' style='margin: 0; width: ${178 * rx}mm; height: auto; border: ${bWd}px solid crimson;'>
		<div style='margin-top: ${2 * ry}mm; width: ${178 * rx}mm; height: ${5.5 * ry}mm; text-align: left; border: ${bWd}px solid crimson;'>
			①世帯の状況　<span style='font-size: 0.8em;'>※対象児童以外の両親及び同じ住所に住んでいる人全員について記入してください。</span>
		</div>
		<table>
			<tr>
				<td class='bgGray' style='width: ${53 * rx}mm; height: ${11 * ry}mm;'>氏名（フリガナ）</td>
				<td class='bgGray' style='width: ${17.5 * rx}mm; height: ${11 * ry}mm;'>対象児童<br>との続柄</td>
				<td class='bgGray' style='width: ${49 * rx}mm; height: ${11 * ry}mm;'>生年月日</td>
				<td class='bgGray' style='width: ${22.5 * rx}mm; height: ${11 * ry}mm;'>性別</td>
				<td class='bgGray' style='width: ${36 * rx}mm; height: ${11 * ry}mm;'>個人番号<br>（マイナンバー）</td>
			</tr>
			${fmRows}
		</table>
		<table class='famRel'>
			<tr>
				<td class='bgGray' style='width: ${21 * rx}mm; height: ${6.5 * ry}mm; font-size: 0.9em;'>世帯の状況</td>
				<td style='width: ${46 * rx}mm; height: ${6.5 * ry}mm;'>
					<div style='position: relative; border: ${bWd}px solid crimson;'>
						<span style='font-size: 0.8em;'>ひとり親世帯等&nbsp;・&nbsp;左記以外</span>
						<!-- Circle around the selected string -->
						<div style='position: absolute; left: ${+fr.frSglPar? 0: 27 * rx}mm; top: -1px; border: 1px solid black; border-radius: 50%; width: ${+fr.frSglPar? 25 * rx: 16 * rx}mm; height: ${5.6 * ry}mm; text-align: center; line-height: ${5.6 * ry}mm;'></div>
					</div>
				</td>
				<td class='bgGray' style='width: ${27 * rx}mm; height: ${6.5 * ry}mm; font-size: 0.9em;'>生活保護適用</td>
				<td style='width: ${84 * rx}mm; height: ${6.5 * ry}mm;'>
					<div style='position: relative; margin-right: auto; width: ${84 * rx}mm; padding-left: ${3 * rx}mm; text-align: left; font-size: 0.9em; border: ${bWd}px solid crimson;'>
						なし&nbsp;・&nbsp;あり${+fr.frLivPro? `（${strDateToJpCal(fr.frLivProStart, '&nbsp;')}保護開始）`:'（　　　年　　月　　日保護開始）'}
						<!-- Circle around the selected string -->
						<div style='position: absolute; left: ${+fr.frLivPro? 14 * rx: 1.5}mm; top: -1px; border: 1px solid black; border-radius: 50%; width: ${9 * rx}mm; height: ${5.6 * ry}mm; text-align: center; line-height: ${5.6 * ry}mm;'></div>
					</div>
				</td>
			</tr>
		</table>
	</div>`
	
	// Parents (with width 453px(=120mm))
	const htParents = `<div id='bcaParents_${rR.cid}' style='margin: 0 0 0 auto; width: ${120 * rx}mm;'>
		<table>
			<tr>
				<td rowspan='3' class='bgGray' style='width: ${9 * rx}mm; height: ${33 * ry}mm; line-height: 220%;'>保<br>護<br>者</td>
				<td class='bgGray' style='width: ${17 * rx}mm; height: ${8 * ry}mm;'>現住所</td>
				<td style='width: ${94 * rx}mm; height: ${8 * ry}mm;'><!-- ${rR.zipcode} -->${rR.cityarea}${rR.street}${rR.building !== null? rR.building: ''}</td>
			</tr>
			<tr>
				<td class='bgGray' style='width: ${17 * rx}mm; height: ${8 * ry}mm;'>氏　名</td>
				<td style='width: ${94 * rx}mm; height: ${8 * ry}mm; font-size: 1.02em;'>${hohLFname}</td>
			</tr>
			<tr>
				<td class='bgGray' style='width: ${17 * rx}mm; height: ${17 * ry}mm;'>電　話</td>
				<td style='width: ${94 * rx}mm; height: ${17 * ry}mm;'>
					
					<div style='margin: 2px 6px; line-height: 160%; text-align: left; font-size: 0.7rem;'>
						自　　宅　&nbsp;&nbsp;${fxdPhone}<br>
						携帯（父）&nbsp;&nbsp;${fPhone}<br>
						携帯（母）&nbsp;&nbsp;${mPhone}
					</div>
					
				</td>
			</tr>
		</table>
	</div>`

	// Target child and the request.
	const htRequest = `<div id='bcaRequest_${rR.cid}' style='margin: 0; width: ${178 * rx}mm; height: auto;'>
		<div style='margin: 0; width: ${178 * rx}mm; height: ${10 * ry}mm; padding-top: ${2 * ry}mm; border: ${bWd}px solid crimson;'>
			次のとおり、子どものための教育・保育給付認定を申請します。
		</div>
		<table>
			<tr>
				<td rowspan='2' class='bgGray' style='width: ${36 * rx}mm; height: ${18.5 * ry}mm;'>申請の対象となる<br>児童</td>
				<td class='bgGray' style='width: ${53 * rx}mm; height: ${6.5 * ry}mm;'>氏名（フリガナ）</td>
				<td class='bgGray' style='width: ${58 * rx}mm; height: ${6.5 * ry}mm;'>生年月日</td>
				<td class='bgGray' style='width: ${31 * rx}mm; height: ${6.5 * ry}mm;'>性別</td>
			</tr>
			<tr>
				<td style='width: ${53 * rx}mm; height: ${12 * ry}mm; padding-left: ${14 * rx}mm; text-align: left;'>
					<div style='display: flex; align-items: flex-start; justify-content: start; margin: 0 auto;'>
						<div>
							<div style='font-size: 0.8em;'>${hiraToKata(rR.clname_k)}</div>
							<div>${rR.clname}</div>
						</div>
						<div style='visibility: hidden;'>-</div>
						<div>
							<div style='font-size: 0.8em;'>${hiraToKata(rR.cfname_k)}</div>
							<div style=''>${rR.cfname}</div>
						</div>
					</div>
				</td>
				<td style='width: ${58 * rx}mm; height: ${12 * ry}mm; font-size: 0.9em;'>${strDateToJpCal(rR.cbirth, '&nbsp;')}</td>
				<td style='width: ${31 * rx}mm; height: ${12 * ry}mm;'>${rR.csex === 'f'? '女': '男'}</td>
			</tr>
			<tr>
				<td rowspan='2' class='bgGray' style='width: ${36 * rx}mm; height: ${13 * ry}mm;'>
					保育の希望の有無<br><span style='font-size: 0.9em;'>（希望するものを○で囲んでください。）</span>
				</td>
				<td colspan='3' style='width: ${142 * rx}mm; height: ${6.5 * ry}mm; text-align: left;'>
					　　あり　<span style='font-size: 0.8em;'>（入園時の子どもの年齢が0歳以上で認定こども園・保育所等での保育を希望される方）</span>
				</td>
			</tr>
			<tr>
				<td colspan='3' style='width: ${142 * rx}mm; height: ${6.5 * ry}mm; text-align: left'>
					<div style='position: relative;'>
						　　なし　<span style='font-size: 0.7rem;'>（入園時の子どもの年齢が3歳以上で認定こども園・幼稚園での教育を希望される方）</span>
						<!-- Circle around the string "なし" -->
						<div style='position: absolute; left: ${5.8 * rx}mm; top: -1px; border: 1px solid black; border-radius: 50%; width: 40px; height: ${5.6 * ry}mm; text-align: center; line-height: ${5.6 * ry}mm;'></div>
					</div>
				</td>
			</tr>
			<tr>
				<td class='bgGray' style='width: ${36 * rx}mm; height: ${6.5 * ry}mm;'>
					認定を希望する期間
				</td>
				<!-- In the following, padding is included in width according to the setting 'box-sizing: border-box'. -->
				<td colspan='3' style='width: ${142 * rx}mm; height: ${6.5 * ry}mm;'>
					<div style='display: flex; align-items: flex-start; justify-content: start; margin: 0 auto; width: 36em;'>
						<div style='width: 11em; text-align: right; border: ${bWd}px solid crimson;'>
							${strDateToJpCal(rR.entdate, '&nbsp;')}
						</div>
						<div style='position: relative; text-align: center; width: 25em; border: ${bWd}px solid crimson;'>
							から（　就学前 ・ 令和　　年　　月　　日　）まで
							<!-- Circle around the string "就学前" -->
							<div style='position: absolute; left: ${15.3 * rx}mm; top: -1px; border: 1px solid black; border-radius: 50%; width: 58px; height: ${5.6 * ry}mm; text-align: center; line-height: ${5.6 * ry}mm;'></div>
						</div>
					</div>
				</td>
			</tr>
		</table>
		<div style='margin: 0; width: ${178 * rx}mm; height: ${3 * ry}mm; font-size: 0.5em; border: ${bWd}px solid crimson;'>
			※保育の希望が「なし」で3歳以上の児童は「1号」, 保育の希望が「あり」で3歳以上の児童は「2号」, 3歳未満の児童は「3号」の認定となります。
		</div>
	</div>`

	// Reasons for needing access to childcare
	const htReasons = `<div id='bcaReason_${rR.cid}' style='width: ${178 * rx}mm; height: auto;'>
		<div style='margin-top: ${2 * ry}mm; width: ${178 * rx}mm; height: ${5.5 * ry}mm; text-align: left; border: ${bWd}px solid crimson;'>
			②保育の利用を必要とする理由　<span style='font-size: 0.8em;'>※「保育の希望の有無」欄で「あり」に○をつけた方のみ記入してください。</span>
		</div>
		<table>
			<tr>
				<td class='bgGray' style='width: ${17.5 * rx}mm; height: ${11 * ry}mm;'>対象児童<br>との続柄</td>
				<td class='bgGray' style='width: ${160.5 * rx}mm; height: ${11 * ry}mm;'>保育の利用を必要とする理由</td>
			</tr>
			<tr>
				<td style='width: ${17.5 * rx}mm; height: ${11 * ry}mm;'></td>
				<td style='width: ${160.5 * rx}mm; height: ${11 * ry}mm; text-align: left;'>
					&nbsp;□就労　&nbsp;□妊娠・出産　&nbsp;□疾病・障がい　&nbsp;□介護・看護　&nbsp;□災害復旧　&nbsp;□求職活動<br>
					&nbsp;□就学　&nbsp;□育児休業　　&nbsp;□その他（　　　　　　　　　　　　　　　　　）
				</td>
			</tr>
			<tr>
				<td style='width: ${17.5 * rx}mm; height: ${11 * ry}mm;'></td>
				<td style='width: ${160.5 * rx}mm; height: ${11 * ry}mm; text-align: left;'>
					&nbsp;□就労　&nbsp;□妊娠・出産　&nbsp;□疾病・障がい　&nbsp;□介護・看護　&nbsp;□災害復旧　&nbsp;□求職活動<br>
					&nbsp;□就学　&nbsp;□育児休業　　&nbsp;□その他（　　　　　　　　　　　　　　　　　）
				</td>
			</tr>
		</table>
		<table>
			<tr>
				<td class='bgGray' style='width: ${35.5 * rx}mm; height: ${6.5 * ry}mm; border-top-width: 0;'>利用を希望する時間</td>
				<td style='width: ${57.5 * rx}mm; height: ${6.5 * ry}mm; border-top-width: 0;'>曜日から　　曜日まで</td>
				<td style='width: ${85 * rx}mm; height: ${6.5 * ry}mm; border-top-width: 0;'>　　時　　分から　　時　　分まで</td>
			</tr>
		</table>
	</div>`

	// Consent form for provision of tax information
	const htConsent = `<div id='bcaConsent_${rR.cid}' style='width: ${178 * rx}mm; height: auto;'>
		<div style='margin-top: ${2 * ry}mm; width: ${178 * rx}mm; height: ${5.5 * ry}mm; text-align: left; border: ${bWd}px solid crimson;'>
			③税情報等の提供に当たっての同意欄
		</div>
		<div style='margin-top: 0; width: ${178 * rx}mm; height: ${24 * ry}mm; border: 1px solid #000000; line-height: 110%; font-size: 0.95em;'>
			　市が子どものための教育・保育給付認定等に必要な市民税の情報（同一世帯者を含む。）及び世帯情報を閲覧すること、また、その情報に基づき決定した利用者負担額について、特定教育・保育施設等に対して提示することに同意します。
			<div style='margin: 0; width: ${178 * rx};'>
				<div style='margin: 0 0 0 auto; width: ${90 * rx}mm; height: ${14 * ry}mm;'>
					<div style='margin-bottom: 2px; border-bottom: 1px solid #222;'>
						保護者氏名（父）　　　${fLFname}
					</div>
					<div>
						保護者氏名（母）　　　${mLFname}
					</div>
				</div>
			</div>
		</div>
	</div>`

	// Entry fields for the City.
	const htForCity = `<div id='bcaCity_${rR.cid}' style='width: ${178 * rx}mm; height: auto;'>
		<table>
			<caption style='text-align: left; font-size: 0.9em;'>
				＊市記載欄
			</caption>
			<tr>
				<td class='bgGray' style='width: ${18 * rx}mm; height: ${8 * ry}mm; font-size: 0.9em;'>認定日</td>
				<td style='width: ${40 * rx}mm; height: ${8 * ry}mm;'>　　年　　月　　日</td>
				<td class='bgGray' style='width: ${17.5 * rx}mm; height: ${8 * ry}mm; font-size: 0.9em;'>認定番号</td>
				<td style='width: ${22.5 * rx}mm; height: ${8 * ry}mm;'></td>
				<td class='bgGray' style='width: ${18 * rx}mm; height: ${8 * ry}mm; font-size: 0.9em;'>認定区分</td>
				<td style='width: ${62 * rx}mm; height: ${8 * ry}mm; font-size: 0.9em;'>□1号　□2号　□3号（□標　□短）</td>
			</tr>
			<tr>
				<td class='bgGray' style='width: ${18 * rx}mm; height: ${8 * ry}mm; font-size: 0.8em;'>初回入所日</td>
				<td style='width: ${40 * rx}mm; height: ${8 * ry}mm;'>　　年　　月　　日</td>
				<td colspan='4' style='border-width: 0px;'></td>
			</tr>
		</table>
	</div>`

	const pageApp = `<div id='bcaPage_${pageNum}' class='appRoot' style='margin-left: ${prt.offsetX}px; margin-top: ${prt.offsetY}px; width: ${178 * rx}mm; height: auto; font-family: serif; font-size: 0.92rem; color: #000000; border: ${bWd}px dashed dimgray;'>
		<div id='header_${rR.cid}' style='width: ${178 * rx}mm; height: ${16 * ry}mm'>
			<div style='margin: 0 auto 0 -10px;'>
				<span style='vertical-align: top; font-size: 0.9em'>様式第1号（第3条関係）</span>
				<span style='visibility: hidden;'>-----</span>
				<span style='font-weight: bold; font-size: 1.2em'>子どものための教育・保育給付認定申請書</span>
			</div>
			<div style='display: flex; align-items: flex-start; justify-content: space-between; margin: 2mm 0 1mm 0; border: ${bWd}px solid red;'>
				<div style='font-size: 0.9em; border: ${bWd}px solid blue;'>（宛先）河内長野市長</div>
				<div style='font-size: 0.9em; border: ${bWd}px solid green;'>令和　${submiss.year - 2018}　年　${submiss.month}　月　${submiss.date}　日</div>
			</div>
		</div>
		${htParents}
		${htRequest}
		${htFamState}
		${htReasons}
		${htConsent}
		<hr style='margin: ${3 * ry}mm 0 ${1 * ry}mm 0; border: 1px dashed #333333;'>
		${htForCity}
	</div>`
	
	return pageApp
}



// Main processing.
const main = () => {
	// Add Print-Style.
	document.head.insertAdjacentHTML('beforeend', PRT_STYLE)
	window.addEventListener('message', (event) => {
		// Confirm the origin.
		if(event.origin !== window.location.origin){
			console.log('Orign was not authenticated!')
			return
		}
		// Main Processing.
		const msg = gMsg = event.data
		const prt = {
			scaleX: msg.prt.scaleX.length? +msg.prt.scaleX: PRT.scaleX,
			scaleY: msg.prt.scaleY.length? +msg.prt.scaleY: PRT.scaleY,
			offsetX: msg.prt.offsetX.length? +msg.prt.offsetX: PRT.offsetX,
			offsetY: msg.prt.offsetY.length? +msg.prt.offsetY: PRT.offsetY
		}
		console.log(msg.purpose)//＊＊＊＊＊＊＊＊＊＊＊＊
		console.log(prt)//＊＊＊＊＊＊＊＊＊＊＊＊
		console.log(msg.resvRel)//＊＊＊＊＊＊＊＊＊＊＊＊
		console.log(msg.dataUrls)//＊＊＊＊＊＊＊＊＊＊＊＊
		// Add Applications (of Admission or Benefit Certtification).
		const elRoot = document.getElementById('root')
		let htApps = ''
		const func = msg.purpose === 'adm'? createAdmApp: createBenfCertApp
		for(let i = 0, len = msg.resvRel.length; i < len; i++){
			if(msg.purpose === 'adm') dataUrl = msg.dataUrls[i]
			htApps += func(msg.resvRel[i], prt, i + 1)
			if(i < len - 1){
				htApps += HT_PAGE_BREAK
			}
		}
		document.getElementById('root').innerHTML = htApps
		// Add portraits on apps.
		for(let i = 0, len = msg.resvRel.length; i < len; i++){
			const rR = msg.resvRel[i]//for shortening.
			const uid_cid = `${rR.uid}_${rR.cid}`
			document.getElementById(`pr_${uid_cid}`).src = msg.dataUrls[uid_cid]
		}
	})
}





// ===============
main()
// ===============

