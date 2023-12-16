/* global document, XMLHttpRequest */
/*
 * IfZ-Sys Visual for expanding IfZ notations using the up-to-date xml https://ifz-muenchen.github.io/IfZ-Systematik/sys.xml
 *
 * derived from https://github.com/bvb-kobv-allianz/RVK-VISUAL
 */

// opac.xml is a copy of sys.xml without superfluous attributes
const ifzSystematikURLred = 'https://ifz-muenchen.github.io/IfZ-Systematik/opac.xml';
const ifzSystematikURL = 'https://ifz-muenchen.github.io/IfZ-Systematik/sys.xml';
const ifzOpacSearchURL = 'https://opac.ifz-muenchen.de/cgi-bin/search?ifzsys=';
// TODO is this link more stable? https://opac.ifz-muenchen.de/webOPACClient.ifzsis/search.do?methodToCall=quickSearch&Kateg=1708&Content=
const xmlDoc = loadXMLDoc(ifzSystematikURLred);

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
				if (currentAncestor.parentNode && currentAncestor.parentNode.parentNode && currentAncestor.parentNode.parentNode.nodeName === 'IfZ-Systematik') {
					// currentAncestor is a grandchild, so skip iteration
					currentAncestor = currentAncestor.parentNode;
					continue;
				}
				const ancestorNotation = currentAncestor.nodeName;
				const ancestorName = currentAncestor.getAttribute('Benennung');
				ancestors.push({
					notation: ancestorNotation,
					name: ancestorName,
				});
				currentAncestor = currentAncestor.parentNode;
			}

			// if there are dots in the notation, create additional hierarchy levels accordingly
			const regexPointPattern = /[a-z]{1,3} \d{1,3}\.?\d{0,3}(?=\.\d{0,3})/gmi;
			let level = notation;
			const regexAncestors = [];
			while (regexPointPattern.test(level)) {
				level = level.match(regexPointPattern)[0];
				const regexElement = xmlDoc.getElementsByTagName(level.replace(/ /, '_'))[0];
				if (regexElement) {
					const regexAncestorNotation = regexElement.nodeName;
					const regexAncestorName = regexElement.getAttribute('Benennung');
					regexAncestors.push({
						notation: regexAncestorNotation,
						name: regexAncestorName,
					});
				}
			}
			ancestors.unshift(...regexAncestors);
			// add the current notation itself to the array
			ancestors.unshift({
				notation: notationElement.nodeName,
				name: notationElement.getAttribute('Benennung')
			})

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

	renderHTML(element, notationInfo, renderAsTooltip) {
		// Create a button for collapsible content
		const collapsibleButton = document.createElement('button');
		collapsibleButton.className = 'ifzsys-collapsible';
		collapsibleButton.innerHTML = `<div><a href="${ifzOpacSearchURL}${encodeURIComponent(notationInfo.notation)}" target="_blank" title="Suche im OPAC (neuer Tab)">${notationInfo.notation.replaceAll('_', ' ')}</a>:</div><div>${notationInfo.name}</div>`;

		// Create a div for the content
		const contentDiv = document.createElement('div');
		contentDiv.className = (renderAsTooltip) ? 'ifzsys-tooltipDiv' : 'ifzsys-content';

		// Populate the contentDiv with ancestor notations and verbalizations
		const ancestors = notationInfo.ancestors;
		if (ancestors && ancestors.length > 0) {
			for (const [index, ancestor] of ancestors.entries()) {
				const notationDiv = document.createElement('div');
				const notation = ancestor.notation.replaceAll('_', ' ')
				if (index === ancestors.length - 1) {
					notationDiv.innerHTML = `<a href="${ifzSystematikURL}#${notation}" target="_blank" title="Zur Systematik-Website (neuer Tab)">${ancestor.notation.replaceAll('_', ' ')}</a>:`;
				} else {
					const spaces = '&nbsp;'.repeat((ancestors.length - index - 2) * 3);
					notationDiv.innerHTML = `${spaces}↳ ${notation}:`;
				}
				const benennungDiv = document.createElement('div');
				benennungDiv.innerHTML = `${ancestor.name}`;
				const levelDiv = document.createElement('div');
				levelDiv.append(notationDiv);
				levelDiv.append(benennungDiv);
				if (index === 0) {
					levelDiv.classList.add('ifzsys-current');
				}
				contentDiv.prepend(levelDiv);
			}
		}

		if (!renderAsTooltip) {
			// Append elements to the element
			element.innerHTML = ''; // Clear existing content
			element.append(collapsibleButton);
		}
		element.append(contentDiv);

		if (!renderAsTooltip) {
			// Add click event listener to toggle the content visibility
			collapsibleButton.addEventListener('click', () => {
				collapsibleButton.classList.toggle('ifzsys-active');
				contentDiv.classList.toggle('ifzsys-active');
				const maxHeight = contentDiv.classList.contains('ifzsys-active') ? contentDiv.scrollHeight + 'px' : '0';
				contentDiv.style.maxHeight = maxHeight;
			});
		}
	}

	renderError(element, notation) {
		// Create a button for collapsible content
		const collapsibleButton = document.createElement('button');
		collapsibleButton.className = 'ifzsys-collapsible';
		collapsibleButton.innerHTML = `${notation.replaceAll('_', ' ')}`;

		// Create a div for the content
		const contentDiv = document.createElement('div');
		contentDiv.className = 'ifzsys-content';
		contentDiv.innerHTML = `<p>Diese Notation konnte in der <a href="${ifzSystematikURL}" target="_blank">aktuellen Version der IfZ-Systematik</a> nicht gefunden werden.</p>`;

		// Append elements to the element
		element.innerHTML = ''; // Clear existing content
		element.append(collapsibleButton);
		element.append(contentDiv);

		// Add click event listener to toggle the content visibility
		collapsibleButton.addEventListener('click', () => {
			collapsibleButton.classList.toggle('ifzsys-active');
			contentDiv.classList.toggle('ifzsys-active');
			const maxHeight = contentDiv.classList.contains('ifzsys-active') ? contentDiv.scrollHeight + 'px' : '0';
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
			this.renderHTML(element, notationInfo, element.className.split(' ').includes('ifzsys-tooltip'));
		} else {
			console.error('Notation not found: ' + notation);
			this.renderError(element, notation);
		}
	}
};


