window.URL = window.URL || window.webkitURL
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame

function getUserMedia(constraints, successCallback, errorCallback) {
    if (!constraints || !successCallback || !errorCallback) {
        return
    }
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia(constraints).then(successCallback, errorCallback)
    } else {
        navigator.getUserMedia(constraints, successCallback, errorCallback)
    }
}

function camvas(ctx, drawFunc, onStartFunc) {
    var self = this
    this.ctx = ctx
    this.draw = drawFunc
    this.looping = true
    this.startTime = null
    this.onStartFunc = onStartFunc
    var streamContainer = document.createElement('div')
    this.video = document.createElement('video')
    this.video.setAttribute('autoplay', '1')
    this.video.setAttribute('width', this.ctx.canvas.width)
    this.video.setAttribute('height', this.ctx.canvas.height)
    this.video.setAttribute('style', 'display:none')
    streamContainer.appendChild(this.video)
    document.body.appendChild(streamContainer)
    getUserMedia({
        video: true
    }, function(stream) {
        self.startTime = Date.now()
        onStartFunc()
        try {
            self.video.srcObject = stream;
        } catch (error) {
            self.video.src = URL.createObjectURL(stream);
        }
        self.update()
    }, function(err) {
        throw err
    })
    this.stop = function() {
        this.looping = false
    }
    this.play = function() {
        if (this.looping) return
        this.looping = true
        this.update()
    }
    this.update = function() {
        var self = this
        var last = Date.now()
        var loop = function() {
            var dt = Date.now() - last
            self.draw(self.video, dt)
            last = Date.now()
            if (self.looping) {
                requestAnimationFrame(loop)
            }
        }
        requestAnimationFrame(loop)
    }
}