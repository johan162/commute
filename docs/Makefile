# Makefile for LaTeX documentation

# Default target
all: DEVELOPER_CHALLENGE_SCORING.pdf

# Build the PDF from LaTeX source
DEVELOPER_CHALLENGE_SCORING.pdf: DEVELOPER_CHALLENGE_SCORING.tex
	pdflatex DEVELOPER_CHALLENGE_SCORING.tex
	pdflatex DEVELOPER_CHALLENGE_SCORING.tex  # Run twice for cross-references

# Clean auxiliary LaTeX files
clean:
	rm -f DEVELOPER_CHALLENGE_SCORING.aux \
	      DEVELOPER_CHALLENGE_SCORING.log \
	      DEVELOPER_CHALLENGE_SCORING.out \
	      DEVELOPER_CHALLENGE_SCORING.fls \
	      DEVELOPER_CHALLENGE_SCORING.fdb_latexmk \
	      DEVELOPER_CHALLENGE_SCORING.synctex.gz

.PHONY: all clean
