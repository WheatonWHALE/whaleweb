!function(){function e(e,t){return e.write('<div class="column large-12 competition">').section(t.get(["entrants"],!1),t,{block:r},null).write("</div>")}function r(e,r){return e.write('<div class="row entrant ').reference(r.get(["id"],!1),r,"h").write('"><div class="column large-3 name"><a class="has-ttip" href="https://github.com/').reference(r.get(["id"],!1),r,"h").write('" data-tooltip=').reference(r.get(["id"],!1),r,"h").write(">").reference(r.get(["name"],!1),r,"h").write(" ").reference(r.get(["year"],!1),r,"h").write('</a></div><div class="column large-3 score">').reference(r.get(["current"],!1),r,"h").write(' days</div><div class="column large-3 score">').reference(r.get(["max"],!1),r,"h").write(' days</div><div class="column large-3 score">').reference(r.get(["total"],!1),r,"h").write(" total</div></div>\n")}return dust.register("competition",e),e}();