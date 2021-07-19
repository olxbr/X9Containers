FROM alpine

RUN apk add curl && curl https://secure.eicar.org/eicar.com -o /eicar.com && chmod +x /eicar.com
RUN echo '#!/bin/bash\necho Hello World' >/entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]