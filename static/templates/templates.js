!function(){function e(e,r){return e.write('<div class="columns large-6 small-centered large-uncentered competition" id="').reference(r.get(["compId"],!1),r,"h").write('"><div class="title">').reference(r.get(["title"],!1),r,"h").write("</div>").section(r.get(["entrants"],!1),r,{block:t},null).write("</div>")}function t(e,t){return e.write('<div class="entrant ').reference(t.get(["id"],!1),t,"h").write('"><div class="name"><a href="https://github.com/').reference(t.get(["id"],!1),t,"h").write('" class="competition-link">').reference(t.get(["name"],!1),t,"h").write(" '").reference(t.get(["year"],!1),t,"h").write(' <span class="user-id">(').reference(t.get(["id"],!1),t,"h").write(')</span></a></div><div class="score">').reference(t.get(["streakVal"],!1),t,"h").write(" ").reference(t.get(["label"],!1),t,"h").write("</div></div>\n")}return dust.register("competition",e),e}();