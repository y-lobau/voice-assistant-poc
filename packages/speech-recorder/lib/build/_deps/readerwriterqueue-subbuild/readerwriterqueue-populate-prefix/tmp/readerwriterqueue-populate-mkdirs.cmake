# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION 3.5)

file(MAKE_DIRECTORY
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-src"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-build"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix/tmp"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix/src/readerwriterqueue-populate-stamp"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix/src"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix/src/readerwriterqueue-populate-stamp"
)

set(configSubDirs )
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix/src/readerwriterqueue-populate-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/readerwriterqueue-subbuild/readerwriterqueue-populate-prefix/src/readerwriterqueue-populate-stamp${cfgdir}") # cfgdir has leading slash
endif()
