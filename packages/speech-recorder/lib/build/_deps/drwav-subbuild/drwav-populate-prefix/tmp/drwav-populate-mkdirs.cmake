# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION 3.5)

file(MAKE_DIRECTORY
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-src"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-build"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/tmp"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src"
  "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp"
)

set(configSubDirs )
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "/home/rpi/speech-recorder/tmp/speech-recorder/lib/build/_deps/drwav-subbuild/drwav-populate-prefix/src/drwav-populate-stamp${cfgdir}") # cfgdir has leading slash
endif()
