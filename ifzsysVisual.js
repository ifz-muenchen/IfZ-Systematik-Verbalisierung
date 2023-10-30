/* global document, XMLHttpRequest */
/*
 * IfZ-Sys Visual for expanding IfZ notations using the up-to-date xml https://ifz-muenchen.github.io/IfZ-Systematik/sys.xml
 *
 * derived from https://github.com/bvb-kobv-allianz/RVK-VISUAL
 */

const ifzSystematikURL = 'https://ifz-muenchen.github.io/IfZ-Systematik/sys.xml';
const ifzOpacSearchURL = 'https://opac.ifz-muenchen.de/cgi-bin/search?ifzsys=';
// TODO is this link more stable? https://opac.ifz-muenchen.de/webOPACClient.ifzsis/search.do?methodToCall=quickSearch&Kateg=1708&Content=
const xmlDoc = loadXMLDoc(ifzSystematikURL);

/**
 * Creates instance of IfzsysVisual with default values.
 * @constructor
 */
class IfzsysVisual {
	constructor(ifzsysClassName) {
		this.ifzsysClassName = (ifzsysClassName === undefined) ? 'ifzsys-expand' : ifzsysClassName;
	}

	/**
     * Creates instance of IfzsysVisual.
     */
	static newInstance(ifzsysClassName) {
		const ifzsysVisual = new IfzsysVisual(ifzsysClassName);
		let instances = null;
		if (IfzsysVisual.instances === undefined) {
			instances = [];
			instances.push(ifzsysVisual);
			IfzsysVisual.instances = instances;
		} else {
			instances = IfzsysVisual.instances;
			instances.push(ifzsysVisual);
		}

		ifzsysVisual.callbackVarName = 'IfzsysVisual.instances[' + (instances.length - 1) + ']';
		return ifzsysVisual;
	}

	/**
     * Prepares HTML to load IfZ-Systematik data for all instances of IfzsysVisual.
     */
	static prepareLinks() {
		const instances = IfzsysVisual.instances;
		for (const element of instances) {
			element.prepareLinks();
		}
	}

	getNotationInfoFromXML(notation) {
		const notationElement = xmlDoc.getElementsByTagName(notation.replace(/ /, '_'))[0];
		if (notationElement) {
			const ancestors = [];
			let currentAncestor = notationElement.parentNode;
			while (currentAncestor.nodeName !== 'IfZ-Systematik') {
				const ancestorNotation = currentAncestor.nodeName;
				const ancestorName = currentAncestor.getAttribute('Benennung');
				ancestors.push({
					notation: ancestorNotation,
					name: ancestorName,
				});
				currentAncestor = currentAncestor.parentNode;
			}

			const notationInfo = {
				notation,
				name: notationElement.getAttribute('Benennung'),
				parent: notationElement.parentNode.nodeName,
				ancestors,
			};
			return notationInfo;
		}

		return null;
	}

	renderHTML(element, notationInfo) {
		// Create a button for collapsible content
		const collapsibleButton = document.createElement('button');
		collapsibleButton.className = 'collapsible';
		collapsibleButton.innerHTML = `<a href="${ifzOpacSearchURL}${encodeURIComponent(notationInfo.notation)}" target="_blank" title="Suche im OPAC (neuer Tab)">${notationInfo.notation.replaceAll('_', ' ')}</a>: ${notationInfo.name}`;

		// Create a div for the content
		const contentDiv = document.createElement('div');
		contentDiv.className = 'content';

		// Populate the contentDiv with ancestor notations and verbalizations
		const ancestors = notationInfo.ancestors;
		if (ancestors && ancestors.length > 0) {
			for (const ancestor of ancestors) {
				const paragraph = document.createElement('div');
				paragraph.innerHTML = `⮤ <a href="${ifzSystematikURL}" target="_blank" title="Zur Systematik-Website (neuer Tab)">${ancestor.notation.replaceAll('_', ' ')}</a>: ${ancestor.name}`;
				contentDiv.append(paragraph);
			}
		}

		// Append elements to the element
		element.innerHTML = ''; // Clear existing content
		element.append(collapsibleButton);
		element.append(contentDiv);

		// Add click event listener to toggle the content visibility
		collapsibleButton.addEventListener('click', () => {
			contentDiv.classList.toggle('active');
			const maxHeight = contentDiv.classList.contains('active') ? contentDiv.scrollHeight + 'px' : '0';
			contentDiv.style.maxHeight = maxHeight;
		});
	}

	renderError(element, notation) {
		// Create a button for collapsible content
		const collapsibleButton = document.createElement('button');
		collapsibleButton.className = 'collapsible';
		collapsibleButton.innerHTML = `${notation.replaceAll('_', ' ')}`;

		// Create a div for the content
		const contentDiv = document.createElement('div');
		contentDiv.className = 'content';
		contentDiv.innerHTML = `<p>Diese Notation konnte in der <a href="${ifzSystematikURL}" target="_blank">aktuellen Version der IfZ-Systematik</a> nicht gefunden werden.</p>`;

		// Append elements to the element
		element.innerHTML = ''; // Clear existing content
		element.append(collapsibleButton);
		element.append(contentDiv);

		// Add click event listener to toggle the content visibility
		collapsibleButton.addEventListener('click', () => {
			contentDiv.classList.toggle('active');
			const maxHeight = contentDiv.classList.contains('active') ? contentDiv.scrollHeight + 'px' : '0';
			contentDiv.style.maxHeight = maxHeight;
		});
	}
}

function loadXMLDoc(filename) {
	const xhttp = new XMLHttpRequest();
	xhttp.open('GET', filename, false);
	xhttp.send();
	return xhttp.responseXML;
}

IfzsysVisual.prototype.prepareLinks = function () {
	const ifzsysElements = Array.from(document.querySelectorAll(`.${this.ifzsysClassName}`));
	for (const element of ifzsysElements) {
		const notation = element.textContent;
		const notationInfo = this.getNotationInfoFromXML(notation);
		if (notationInfo) {
			this.renderHTML(element, notationInfo);
		} else {
			console.error('Notation not found: ' + notation);
			this.renderError(element, notation);
		}
	}
};


