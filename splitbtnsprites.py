import PIL.Image

sprites = PIL.Image.open("public/static/btnslice9.png")
names =[["dark", "dark-flat"], ["light", "light-flat"]]
w = 15
h = 16

for yi, y in enumerate(names):
    for xi, x in enumerate(y):
        sprites.crop((xi*w, yi*h, (xi+1)*w, (yi+1)*h)).save("public/static/btn-{}.png".format(x))
