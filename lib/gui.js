define([ "chroma-js", "map", "sidebar", "tabs", "container", "meshstats",
         "legend", "linklist", "nodelist", "simplenodelist", "infobox/main",
         "proportions", "forcegraph", "title", "about", "datadistributor",
         "filters/filtergui" ],
function (chroma, Map, Sidebar, Tabs, Container, Meshstats, Legend, Linklist,
          Nodelist, SimpleNodelist, Infobox, Proportions, ForceGraph,
          Title, About, DataDistributor, FilterGUI) {
  return function (config, router) {
    var self = this
    var content
    var contentDiv

    var linkScale = chroma.scale(chroma.bezier(["#04C714", "#FF5500", "#F02311"])).domain([1, 5])
    var sidebar

    var buttons = document.createElement("div")
    buttons.classList.add("buttons")

    var fanout = new DataDistributor()
    var fanoutUnfiltered = new DataDistributor()
    fanoutUnfiltered.add(fanout)

    function removeContent() {
      if (!content)
        return

      router.removeTarget(content)
      fanout.remove(content)

      content.destroy()

      content = null
    }

    function addContent(K) {
      removeContent()

      content = new K(config, linkScale, sidebar.getWidth, router, buttons)
      content.render(contentDiv)

      fanout.add(content)
      router.addTarget(content)
    }

    function mkView(K) {
      return function () {
        addContent(K)
      }
    }

    var loader = document.getElementsByClassName("loader")[0]
    loader.classList.add("hide")

    contentDiv = document.createElement("div")
    contentDiv.classList.add("content")
    document.body.appendChild(contentDiv)

    sidebar = new Sidebar(document.body)

    contentDiv.appendChild(buttons)

    var buttonToggle = document.createElement("button")
    buttonToggle.textContent = "\uF133"
    buttonToggle.onclick = function () {
      if (content.constructor === Map)
        router.view("g")
      else
        router.view("m")
    }

    buttons.appendChild(buttonToggle)

    function toggleScreenshotMode () {
      screenshotMode = !screenshotMode
      sidebar.container.classList.toggle('hide')
      buttons.classList.toggle('hide')
      Array.from(document.querySelectorAll('.leaflet-bottom')).forEach(function (el) {
        el.classList.toggle('hide')
      })
    }

    var screenshotMode = false

    var info = document.createElement("div")
    info.classList.add("info-screenshot")
    info.classList.add("vanish")
    info.textContent = "ESC zum beenden des Screenshot-Modus"
    document.body.appendChild(info)

    document.addEventListener("keydown", function(evt) {
      if (!screenshotMode)
        return

      evt = evt || window.event
      var isEscape = false

      if ("key" in evt)
        isEscape = (evt.key === "Escape" || evt.key === "Esc")
      else
        isEscape = (evt.keyCode === 27)

      if (isEscape)
        toggleScreenshotMode()
    })

    var buttonScreenshot = document.createElement("button")
    buttonScreenshot.textContent = "\uF118"
    buttonScreenshot.onclick = function () {
      toggleScreenshotMode()
      info.classList.remove("vanish")
      setTimeout(function () {
        info.classList.add("vanish")
      }, 5000)
    }

    buttons.appendChild(buttonScreenshot)

    var title = new Title(config)

    var header = new Container("header")
    var infobox = new Infobox(config, sidebar, router)
    var tabs = new Tabs()
    var overview = new Container()
    var meshstats = new Meshstats(config)
    var legend = new Legend()
    var newnodeslist = new SimpleNodelist("new", "firstseen", router, "Neue Knoten")
    var lostnodeslist = new SimpleNodelist("lost", "lastseen", router, "Verschwundene Knoten")
    var nodelist = new Nodelist(router)
    var linklist = new Linklist(linkScale, router)
    var statistics = new Proportions(config, fanout)
    var about = new About()

    fanoutUnfiltered.add(meshstats)
    fanoutUnfiltered.add(newnodeslist)
    fanoutUnfiltered.add(lostnodeslist)
    fanout.add(nodelist)
    fanout.add(linklist)
    fanout.add(statistics)

    sidebar.add(header)
    header.add(meshstats)
    header.add(legend)

    overview.add(newnodeslist)
    overview.add(lostnodeslist)

    var filterGUI = new FilterGUI(fanout)
    fanout.watchFilters(filterGUI)
    header.add(filterGUI)

    sidebar.add(tabs)
    tabs.add("Aktuelles", overview)
    tabs.add("Knoten", nodelist)
    tabs.add("Verbindungen", linklist)
    tabs.add("Statistiken", statistics)
    tabs.add("Über", about)

    router.addTarget(title)
    router.addTarget(infobox)

    router.addView("m", mkView(Map))
    router.addView("g", mkView(ForceGraph))

    router.view("m")

    self.setData = fanoutUnfiltered.setData

    return self
  }
})
