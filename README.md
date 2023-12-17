# IfZ-Systematik - Verbalisierung im OPAC

Bei der Titelanzeige im OPAC kann unter dem Reiter *mehr zum Titel* eine Verbalisierung der Sytematikpunkte des Titels angezeigt werden.
Durch einen Klick auf die Verbalisierung oder das *+-Symbol* in der rechten Ecke wird auch die Einordnung des Systematikpunktes in den größeren Kontext angezeigt.

## Im webOPACClient-Code durchgeführte Änderungen

**jsp -> common -> metaHeader.jsp**

Hinzugefügte Zeilen:
```html
<link rel="stylesheet" href="${pageContext.request.contextPath}/jsp/result/ifzsys-visual.css" type="text/css"/>
<script src="${pageContext.request.contextPath}/js/ifzsysVisual.js" type="text/javascript"><!-- --></script>
```
---

**jsp -> result -> titleinfo.jsp**

Hinzugefügte Zeilen zum Skript im Kopfbereich:
```js
// IfZ-Systematik-Verbalisierung beim Seitenaufruf hinzufügen
var ifzsysVisual = IfzsysVisual.newInstance('ifzsys-expand');
function ifzsys_visual_prepareLinks() {
  IfzsysVisual.prepareLinks();
}
window.addEventListener("load", ifzsys_visual_prepareLinks, false);
```

Veränderter Block:
```jsp
<c:when test='${fn:indexOf(content.key, "1708.1") != -1 && fn:endsWith(content.key, "1708.1")}'>
  <strong class="c2">${igf:getCategoryResultLabel("1708", igf:getLanguage(pageContext))}:</strong>
  <%-- IfZ-Systematik-Verbalisierung: umgebendes div hinzugefügt --%>
  <div>
    <c:forEach items='${igf:availableCategories(currenthit, "1708,1708.*")}' var="ifznotation" varStatus="status">
      <%-- IfZ-Systematik-Verbalisierung: class="ifzsys-expand" hinzugefügt --%>
      <a class="ifzsys-expand" href="${igf:getQuickLinkFunction(pageContext, '1708', igf:value(currenthit, ifznotation))}">
        <c:out value='${igf:value(currenthit, ifznotation)}'/>
      </a>
      <c:if test='${status.last}'></c:if>
    </c:forEach>
  <%-- IfZ-Systematik-Verbalisierung: br entfernt, umgebendes div hinzugefügt --%>
  </div>
</c:when>
```

**jsp -> result -> teaser.jsp**

Hinzugefügte Zeilen im Kopfbereich (unter `<!-- START jsp/result/teaser.jsp -->`):
```js
<script language="javascript" type="text/javascript">
  // IfZ-Systematik-Verbalisierung beim Seitenaufruf hinzufügen
  var ifzsysVisual = IfzsysVisual.newInstance('ifzsys-expand');
  function ifzsys_visual_prepareLinks() {
    IfzsysVisual.prepareLinks();
  }
  window.addEventListener("load", ifzsys_visual_prepareLinks, false);
</script>
```

Veränderter Block:
```jsp
<c:if test='${fn:length(igf:availableValues(currenthit, "1708, 1708.*")) > 0}'>
  <strong class="c2">${igf:getCategoryResultLabel("1708", igf:getLanguage(pageContext))}:</strong>          <c:forEach items='${igf:availableCategories(currenthit, "1708,1708.*")}' var="ifznotation" varStatus="status">
    <%-- IfZ-Systematik-Verbalisierung: class="ifzsys-expand ifzsys-tooltip" hinzugefügt --%>
    <a class="ifzsys-expand ifzsys-tooltip" href="${igf:getQuickLinkFunction(pageContext, '1708', igf:value(currenthit, ifznotation))}"><c:out value='${igf:value(currenthit, ifznotation)}'/></a>
      <c:if test='${status.last}'><br/></c:if>
  </c:forEach>
</c:if>

```

---

**Neu erstellte Dateien**

*ifzsys-visual.css* im Ordner `jsp -> result`

*ifzsysVisual.js* im Ordner `js`
