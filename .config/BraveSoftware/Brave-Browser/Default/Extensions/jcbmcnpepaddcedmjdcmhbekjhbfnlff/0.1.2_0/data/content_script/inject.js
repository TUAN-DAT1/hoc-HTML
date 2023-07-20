if (!background) {
  var background = (function () {
    var tmp = {};
    /*  */
    chrome.runtime.onMessage.addListener(function (request) {
      for (var id in tmp) {
        if (tmp[id] && (typeof tmp[id] === "function")) {
          if (request.path === "background-to-page") {
            if (request.method === id) {
              tmp[id](request.data);
            }
          }
        }
      }
    });
    /*  */
    return {
      "receive": function (id, callback) {
        tmp[id] = callback;
      },
      "send": function (id, data) {
        chrome.runtime.sendMessage({
          "method": id, 
          "data": data,
          "path": "page-to-background"
        }, function () {
          return chrome.runtime.lastError;
        });
      }
    }
  })();

  var config = {
    "ruler": {
      "x": null,
      "y": null,
      "element": {},
      "width": null,
      "height": null,
      "action": true,
      "active": false,
      "status": false,
      "start": {"x": null, "y": null},
      "scroll": {"x": null, "y": null},
      "current": {"x": null, "y": null},
      "build": function () {
        config.ruler.element.rect = document.createElement("div");
        config.ruler.element.container = document.createElement("div");
        /*  */
        config.ruler.element.rect.className = "rulermode-rectangle";
        config.ruler.element.container.className = "rulermode-container";
        /*  */
        document.body.appendChild(config.ruler.element.container);
        document.body.appendChild(config.ruler.element.rect);
      },
      "info": {
        "remove": function () {
          background.send("button", {"icon": "OFF"});
          let target = document.querySelector(".rulermode-info");
          if (target) target.remove();
        },
        "add": function () {
          background.send("button", {"icon": "ON"});
          config.ruler.element.info = document.createElement("div");
          /*  */
          config.ruler.element.info.textContent = "Ruler mode...";
          config.ruler.element.info.className = "rulermode-info";
          document.body.appendChild(config.ruler.element.info);
        }
      },
      "keydown": function (e) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        /*  */
        if (e.key === "Escape") background.send("escape", {"state": "OFF"});
        /*  */
        if (e.key === "ArrowUp") config.ruler.input.move({"stepX": 0, "stepY": -1, "type": "keydown"});
        if (e.key === "ArrowDown") config.ruler.input.move({"stepX": 0, "stepY": +1, "type": "keydown"});
        if (e.key === "ArrowLeft") config.ruler.input.move({"stepX": -1, "stepY": 0, "type": "keydown"});
        if (e.key === "ArrowRight") config.ruler.input.move({"stepX": +1, "stepY": 0, "type": "keydown"});
      },
      "hide": function () {
        config.ruler.info.remove();
        /*  */
        if (config.ruler.element.rect) config.ruler.element.rect.remove();
        if (config.ruler.element.container) config.ruler.element.container.remove();
        /*  */
        document.removeEventListener("mouseup", config.ruler.input.end);
        document.removeEventListener("mousemove", config.ruler.input.move);
        document.removeEventListener("mousedown", config.ruler.input.init);
        /*  */
        document.removeEventListener("touchend", config.ruler.input.end);
        document.removeEventListener("touchmove", config.ruler.input.move);
        document.removeEventListener("touchstart", config.ruler.input.init);
        /*  */
        document.documentElement.removeAttribute("rulermode");
        document.removeEventListener("keydown", config.ruler.keydown);
      },
      "show": function () {
        let target = document.querySelector(".rulermode-container");
        if (!target) {
          config.ruler.build();
          config.ruler.info.add();
          /*  */
          document.addEventListener("mouseup", config.ruler.input.end);
          document.addEventListener("mousemove", config.ruler.input.move);
          document.addEventListener("mousedown", config.ruler.input.init);
          /*  */
          document.addEventListener("touchend", config.ruler.input.end);
          document.addEventListener("touchmove", config.ruler.input.move);
          document.addEventListener("touchstart", config.ruler.input.init);
          /*  */
          document.documentElement.setAttribute("rulermode", '');
          document.addEventListener("keydown", config.ruler.keydown);
        }
      },
      "input": {
        "end": function (e) {
          if (e.cancelable) e.preventDefault();
          /*  */
          config.ruler.active = false;
        },
        "init": function (e) {
          if (e.cancelable) e.preventDefault();
          /*  */
          config.ruler.active = true;
          /*  */
          config.ruler.element.rect.style.width = 0;
          config.ruler.element.rect.style.height = 0;
          config.ruler.element.rect.textContent = '';
          config.ruler.element.rect.style.borderWidth = 0;
          /*  */
          config.ruler.scroll.y = document.body.scrollTop;
          config.ruler.scroll.x = document.body.scrollLeft;
          config.ruler.start.x = (e.type === "touchstart" || e.type === "mousedown") ? (e.type.startsWith("mouse") ? e.clientX : (e.type.startsWith("touch") ? e.touches[0].clientX : 0)) : config.ruler.current.x + e.stepX;
          config.ruler.start.y = (e.type === "touchstart" || e.type === "mousedown") ? (e.type.startsWith("mouse") ? e.clientY : (e.type.startsWith("touch") ? e.touches[0].clientY : 0)) : config.ruler.current.y + e.stepY;
        },
        "move": function (e) {
          if (e.cancelable) e.preventDefault();
          /*  */
          let action = e.type === "keydown" || (config.ruler.active && (e.type === "touchmove" || e.type === "mousemove"));
          if (action) {
            if (config.ruler.element.rect) {
              config.ruler.current.x = (e.type === "touchmove" || e.type === "mousemove") ? (e.type.startsWith("mouse") ? e.clientX : (e.type.startsWith("touch") ? e.touches[0].clientX : 0)) : config.ruler.current.x + e.stepX;
              config.ruler.current.y = (e.type === "touchmove" || e.type === "mousemove") ? (e.type.startsWith("mouse") ? e.clientY : (e.type.startsWith("touch") ? e.touches[0].clientY : 0)) : config.ruler.current.y + e.stepY;
              /*  */
              config.ruler.width = Math.abs(config.ruler.start.x - config.ruler.current.x);
              config.ruler.height = Math.abs(config.ruler.start.y - config.ruler.current.y);
              /*  */
              let text = {};
              let width = config.ruler.width;
              let height = config.ruler.height;
              let top = config.ruler.scroll.y + (config.ruler.current.y < config.ruler.start.y ? config.ruler.current.y : config.ruler.start.y);
              let left = config.ruler.scroll.x + (config.ruler.current.x < config.ruler.start.x ? config.ruler.current.x : config.ruler.start.x);
              /*  */
              config.ruler.element.rect.style.top = top + "px";
              config.ruler.element.rect.style.left = left + "px";
              config.ruler.element.rect.style.width = width + "px";
              config.ruler.element.rect.style.height = height + "px";
              config.ruler.element.rect.style.borderWidth = "1px";
              /*  */
              text.width = 110;
              text.height = 32;
              text.spacing = 3;
              text.adjustment = 1;
              text.a = document.createElement("div");
              text.b = document.createElement("div");
              text.c = document.createElement("div");
              text.d = document.createElement("div");
              text.e = document.createElement("div");
              text.f = document.createElement("div");
              /*  */
              const cond_1 = width * height > 2 * text.width * text.height;
              const cond_2 = width > (2 * text.width) && (height > (text.height + 2 * text.adjustment));
              const cond_3 = height > (2 * text.height) && (width > (text.width + 2 * text.adjustment));
              const visible = cond_1 && (cond_2 || cond_3);
              /*  */
              text.a.textContent = "(y) " + top + "px";
              text.b.textContent = "(x) " + left + "px";
              text.c.textContent = "(w) " + width + "px";
              text.d.textContent = "(h) " + height + "px";
              text.e.textContent = "(x) " + (left + width) + "px";
              text.f.textContent = "(y) " + (top + height) + "px";
              /*  */
              text.a.style.left = 0;
              text.a.style.top = -1 * (text.height + text.spacing) + "px";
              /*  */
              text.b.style.top = 0;
              text.b.style.left = -1 * (text.width + text.spacing) + "px";
              /*  */
              text.c.style.top = visible ? 0 : (height + text.height) + "px";
              text.c.style.left = visible ? (width / 2 - (text.width / 2) - 2 * text.adjustment) + "px" : (width - text.adjustment) + "px";
              /*  */
              text.d.style.left = visible ? 0 : (width + text.width) + "px";
              text.d.style.top = visible ? (height / 2 - (text.height / 2) - 2 * text.adjustment) + "px" : (height + text.height) + "px";
              /*  */
              text.e.style.left = visible ? (width - text.adjustment) + "px" : (width - text.adjustment) + "px";
              text.e.style.top = visible ? (height - (text.height + text.spacing + text.adjustment)) + "px" : (height - text.adjustment) + "px";
              /*  */
              text.f.style.top = visible ? (height - text.adjustment) + "px" : (height - text.adjustment) + "px";
              text.f.style.left = visible ? (width - (text.width + text.spacing + text.adjustment)) + "px" : (width + text.width) + "px";
              /*  */
              config.ruler.element.rect.textContent = '';
              config.ruler.element.rect.appendChild(text.a);
              config.ruler.element.rect.appendChild(text.b);
              config.ruler.element.rect.appendChild(text.c);
              config.ruler.element.rect.appendChild(text.d);
              config.ruler.element.rect.appendChild(text.e);
              config.ruler.element.rect.appendChild(text.f);
            }
          }
        }
      }
    }
  };
  //
  background.receive("rulermode", function (e) {
    config.ruler[e.state === "ON" ? "show" : "hide"]();
  });
}
