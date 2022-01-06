all: $(patsubst %.puml,%.png,$(wildcard *.puml))

%.png: %.puml plantuml.skin
	plantuml $<
