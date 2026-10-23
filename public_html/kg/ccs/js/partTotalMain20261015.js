/*
 * partTotalMain.js
 */

// Infimum for the possible FYs.
const INF_FY = 2017

// Current Datetime
curDt = new Date()

// "curUt" (unixtime for "curDt"). It is declaired globally.
curUt = curDt.getTime()

// Current FY (Fiscal Year i.e. School Year)
curFy = curDt.getFullYear() + (curDt.getMonth() < 3? -1: 0)

// Global variable for the received broadcastchannel "message".
let gData

// main element
const MAIN = document.getElementById('main')

// Connect the "part_total" channel.
const bc = new BroadcastChannel("part_total")

// Main processing.
const main = () => {
	// Receiving message, the participation total views are constructed.
	bc.onmessage = (event) => {
		const data = gData = event.data

		// Prepare the partTotal tr's indexed by eids. They will be used as the payload tr's for both types of displays.
		const partTotalTrs = {}
		for(let [eid, pT] of Object.entries(data.eidPartTotal)) {
			const typ = eid.slice(0,2)
			let part, abs
			if((new Date(pT.date_s)) < curDt) {
				part = pT.part
				abs = pT.resv - part
			}else{
				abs = part = '-'
			} 
			partTotalTrs[eid] = `<tr><td class='eid ${typ}'>${eid}</td><td class='date_s ${typ}'>${pT.date_s}</td><td class='etitle ${typ}'>${pT.etitle}</td><td class='resv ${typ}'>${pT.resv}</td><td class='part ${typ}'>${part}</td><td class='abs ${typ}'>${abs}</td></tr>`
		}

		// Get the object "typName" = {wk: 'わくわくキッズ', bc: 'ベビーCLUB', op: 'にこにこ広場', …} from data.types.
		const typName = data.types.reduce((a, v) => (a[v.typ] = v.name, a), {})

		// Prapare the outer elements for the two display types. The difference between the two display types lies in the second index of the data object (one is "ym", the other is "typ").
		const elYmDisp = document.createElement('div')
		elYmDisp.id = 'ymDisp'
		elYmDisp.classList.add('ymAndTypDisp')
		const elTypDisp = document.createElement('div')
		elTypDisp.id = 'typDisp'
		elTypDisp.classList.add('ymAndTypDisp')

		// Header tr elements for participateion total tables. It is common to both type of views.
		const headerTr = "<tr><th>eid</th><th>実施日</th><th>タイトル</th><th>予約数</th><th>参加数</th><th>欠席数</th></tr>"
		const headerTtlTr = "<tr class='totalRow'><th></th><th>予約数</th><th>参加数</th><th>欠席数</th></tr>"

		// Construct the both views concurrently. Each view has "fy" as the first index.
		for(let fy = curFy; fy >= INF_FY; fy--) {
			// FY-wrap for Ym.
			const elYmFy = document.createElement('div')
			elYmFy.classList.add('fy')

			// FY totals are common to both ym and typ. "min1ComplInFy" means "at least one is completed in this FY".
			let fyResv = 0, fyPart = 0

			// Array of Ym's (by DESC) in the fy. e.g. ['202603', ... , '202601', '202512', '202511', ... '202504'].
			const fyYmArr = [...Array(12)].map((_, i) => (i < 3)? `${100*(fy+1)+3-i}`: `${100*fy+15-i}`)
			for(let ym of fyYmArr) {
				if(!(ym in data.fyYmEid[fy])) continue
				elYmFy.insertAdjacentHTML('beforeend', `<div class='ymTypTitle'>［${ym.slice(0,4)}年${+ym.slice(4,)}月］</div>`)
				// Bind trs for the "ym" from partTotalTrs.
				let trs = ""
				// (min1Cpmpl === true) means that at least one event is complemented in this "ym".
				let monResv = 0, monPart = 0, min1Compl = false
				for(let eid of data.fyYmEid[fy][ym]) {
					trs += partTotalTrs[eid]
					const pT = data.eidPartTotal[eid]// for shortening.
					monResv += pT.resv
					if((new Date(pT.date_s)) < curDt) {
						monPart += pT.part
						min1Compl = true
					}
				}
				fyResv += monResv
				fyPart += monPart
				// Total row for this ym.
				let monAbs
				if(min1Compl) {
					monAbs = monResv - monPart
				}else{
					monAbs = monPart = '-'// monResv remains valid in this case.
				}
				const monTtlTr = `<tr class='totalRow'><td colspan='3'>${ym.slice(0,4)}年${+ym.slice(4,)}月　計</td><td class='resv'>${monResv}</td><td class='part'>${monPart}</td><td class='abs'>${monAbs}</td></tr>`
				elYmFy.insertAdjacentHTML('beforeend', `<div class='tableWrap'><table>${headerTr}${trs}${monTtlTr}</table></div>`)
			}
			elYmDisp.insertAdjacentElement('beforeend', elYmFy)
			
			// FY-wrap for Typ.
			const elTypFy = document.createElement('div')
			elTypFy.classList.add('fy')

			for(let typ of data.ccsTyps) {
				if(!(typ in data.fyTypEid[fy])) continue
				elTypFy.insertAdjacentHTML('beforeend', `<div class='ymTypTitle ${typ}'>◆${typName[typ]}</div>`)
				// Bind trs for the "typ" from partTotalTrs.
				let trs = ""
				// (min1Cpmpl === true) means that at least one event is complemented in this typ.
				let typResv = 0, typPart = 0, min1Compl = false
				for(let eid of data.fyTypEid[fy][typ]) {
					trs += partTotalTrs[eid]
					const pT = data.eidPartTotal[eid]// for shortening.
					typResv += pT.resv
					if((new Date(pT.date_s)) < curDt) {
						typPart += pT.part
						min1Compl = true
					}
				}
				// Total row for this typ.
				let typAbs
				if(min1Compl) {
					typAbs = typResv - typPart
				}else{
					typAbs = typPart = '-'// typResv remains valid in this case.
				}
				const typTtlTr = `<tr class='totalRow'><td colspan='3'>${fy}年度 ${typName[typ]}　計</td><td class='resv'>${typResv}</td><td class='part'>${typPart}</td><td class='abs'>${typAbs}</td></tr>`
				elTypFy.insertAdjacentHTML('beforeend', `<div class='tableWrap'><table>${headerTr}${trs}${typTtlTr}</table></div>`)
			}
			elTypDisp.insertAdjacentElement('beforeend', elTypFy)
	
			// Add Fy-title and FY-total to elYmFy and elTypFy.
			const fyTitle = `<div class='fyTitle'>${fy}年度</div>`
			const fyTtlTable = `<div class='tableWrap'><table>${headerTtlTr}<tr class='totalRow'><td class='colspan3'>${fy}年度　合計</td><td class='resv'>${fyResv}</td><td class='part'>${fyPart}</td><td class='abs'>${fyResv - fyPart}</td></tr></table></div>`
			elYmFy.insertAdjacentHTML('afterbegin', fyTitle + fyTtlTable)
			elTypFy.insertAdjacentHTML('afterbegin', fyTitle + fyTtlTable)
		}

		// Two type of views above are merged into the whole element.
		const elWhl = document.createElement('div')
		elWhl.classList.add('partTotal')
		const htHeader = `<div class='topWrap'>
			<div class='topTitle'>子育て支援プログラム　参加者集計</div>
			<div id='totalBy'>
				<div id='byYm' class='on'>月別</div>
				<div id='byTyp' class='off'>種別</div>
			</div>
		</div>`
		elWhl.insertAdjacentHTML('beforeend', htHeader)

		elWhl.insertAdjacentElement('beforeend', elYmDisp)
		elWhl.insertAdjacentElement('beforeend', elTypDisp)

		// Put the whole element in "partTotalHtml".
		MAIN.insertAdjacentElement('beforeend', elWhl)

		// Add an event-listener to switch the displays of "ym" and "typ".
		document.getElementById('totalBy').addEventListener('click', function(e) {
			Array.from(e.currentTarget.children).forEach( (el) => {
				el.classList.toggle('on')
				el.classList.toggle('off')
			})
			if(document.getElementById('byYm').classList.contains('on')){
				elYmDisp.style.display = 'block'
			}else{
				elYmDisp.style.display = 'none'
			}
			if(document.getElementById('byTyp').classList.contains('on')){
				elTypDisp.style.display = 'block'
			}else{
				elTypDisp.style.display = 'none'
			}
		})
	}
}


// ===============
main()
// ===============
